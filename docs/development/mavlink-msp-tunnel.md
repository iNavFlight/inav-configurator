# MSP over MAVLink tunnel

## What it is

When the Configurator is connected to a port that speaks MAVLink but not MSP (typically a radio link on a MAVLink telemetry port), it carries MSP inside MAVLink `TUNNEL` messages. The tabs do not notice this. They still call `MSP.send_message()`, and the difference sits in the transport, the queue and a handful of connection hooks.

| File | Role |
|---|---|
| `js/mavlink/mavlinkProtocol.js` | Message ids, CRC_EXTRA/length table, CRC, MAVLink 2 frame encoder, HEARTBEAT/COMMAND_LONG/COMMAND_ACK codecs |
| `js/mavlink/mavlinkParser.js` | Byte-stream parser (MAVLink 1 and 2, signed frames), validate-then-consume resync |
| `js/mavlink/mavlinkTunnel.js` | TUNNEL payload codec: 128-byte request chunks, reply filter |
| `js/mavlink/mavlinkLink.js` | Bytes in, callbacks out: heartbeat filter, target lock, sequence numbers, reassembly timeout |
| `js/mavlink/mavlinkTelemetry.js` | MAVLink telemetry decoded into the same `FC.*` fields MSPHelper fills |
| `js/mavlink/mavlinkStreamControl.js` | `MAV_CMD_SET_MESSAGE_INTERVAL` queue, acks, restore list |
| `js/mavlink/mavlinkTelemetryFeed.js` | Answers covered MSP reads from telemetry ("virtual replies") |
| `js/mavlink/tunnelRebootMonitor.js` | Confirms `MSP_SET_REBOOT` on a link that survives the reboot |
| `js/serial_queue.js` | Tunnel mode of the MSP scheduler, adaptive silence window |
| `js/msp.js` | Lost-reply bookkeeping, decoder reset, virtual-reply and reboot hooks |
| `js/serial_backend.js` | Detection, handshake, GCS heartbeat, reboot glue, feed start/stop |
| `js/periodicStatusUpdater.js` | Status polling cadence in tunnel mode |

## What the firmware offers

The firmware side lives in [`src/main/fc/fc_mavlink.c`](https://github.com/iNavFlight/inav/blob/maintenance-10.x/src/main/fc/fc_mavlink.c) (`handleIncoming_TUNNEL()` and helpers) and [`src/main/mavlink/mavlink_internal.h`](https://github.com/iNavFlight/inav/blob/maintenance-10.x/src/main/mavlink/mavlink_internal.h) (constants). The user documentation is the ["MSP over MAVLink tunnel" section of `docs/Mavlink.md`](https://github.com/iNavFlight/inav/blob/maintenance-10.x/docs/Mavlink.md#msp-over-mavlink-tunnel).

- **Transport:** standard `TUNNEL` (id 385), `payload_type` `0x8001` (`MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP`). The payload is a slice of the framed MSP byte stream (`$X<…` including checksum), up to 128 bytes per message. The FC feeds it byte by byte into its normal MSP parser. A longer `payload_length` resets the parser and drops the message.
- **MAVLink 2 only:** with `mavlink_version = 1` the handler returns without processing.
- **Addressing:** `target_system` must equal the FC's `mavlink_sysid`, and `target_component` must be 0 or the FC's component. Replies go to the requester's sysid/compid on the port the request came in on.
- **One parser per MAVLink port** (`mavTunnelMspPorts[]`, separate from the serial MSP ports). The FC queues nothing, so a second request sent before the first reply lands in the same parser.
- **Partial-frame timeout:** a partial MSP frame is discarded when the next chunk arrives `MAVLINK_TUNNEL_MSP_TIMEOUT_MS` (1000 ms) or more later, or comes from a different sysid/compid.
- **No sequence numbers, no request ids, no ACKs.** Chunks are concatenated in arrival order. If a chunk is lost, the MSP checksum fails and the FC sends nothing back (no error frame). A reply names only its MSP code.
- **Replies** are cut into consecutive 128-byte chunks, one `TUNNEL` each, zero-padded, so MAVLink 2 trims the trailing zeros on the wire.
- **Refused commands:** `MSP_SET_PASSTHROUGH` gets an error reply. The FC also answers with an error, instead of running the command, for any command that registers a post-process function, with one exception: `MSP_REBOOT` (the Configurator's `MSP_SET_REBOOT`, code 68). That one replies first and reboots after the TX buffer has drained. An armed FC answers `MSP_REBOOT` with an error (`mspFcProcessCommand()` in `fc_msp.c`). No CLI is available over the tunnel.

On `maintenance-10.x` with iNavFlight/inav#12036 (first tagged in 10.0.0-rc2), a reply chunk that does not fit into the port's TX buffer waits. `mavlinkFlushTunnelMspReply()` in `fc_mavlink.c` resumes the reply on the port's next MAVLink cycle and abandons it only after `MAVLINK_TUNNEL_MSP_TIMEOUT_MS` (1000 ms) without progress. While a reply is still pending, a newly completed request is dropped without a reply. 10.0.0-rc1 predates that fix: its reply chunks are written back to back, and `mavlinkSendMessage()` in [`mavlink_runtime.c`](https://github.com/iNavFlight/inav/blob/10.0.0-rc1/src/main/mavlink/mavlink_runtime.c) drops a frame when the port's TX buffer has no room for it. On a hardware UART, a large reply can therefore lose a chunk there. The Configurator treats an abandoned or incomplete reply as a normal lost reply.

## How a session starts

`privateScope.onOpen()` in `js/serial_backend.js` registers three receive listeners on every connection:

1. `read_serial`: the plain MSP decoder (or the CLI).
2. `read_ltm`: the LTM groundstation gate.
3. `read_mavlink`: feeds `MavlinkLink.ingest()`.

It then sends a raw `MSP_API_VERSION` as always. Detection is passive: nothing is sent over MAVLink until the FC's heartbeat has been seen.

- **Plain MSP wins.** A port that serves both MSP and MAVLink answers the raw probe. As soon as `MSP.wasEverReceiving()` is true, `read_mavlink` detaches itself.
- **Heartbeat filter** (`MavlinkLink._handleHeartbeat()`): the link ignores its own heartbeats (253/25), anything with compid ≠ 1 and anything whose type is `MAV_TYPE_GCS`. A MAVLink 1 heartbeat only sets `v1HeartbeatSeen`.
- **500 ms raw-MSP priority window:** the first MAVLink 2 FC heartbeat does not switch immediately. The switch is scheduled for `rawProbeSentAt + RAW_MSP_PRIORITY_WINDOW_MS`. If MSP has answered by then, the session stays on MSP and logs `mavlinkTunnelSkippedPlainMsp`.
- **Heartbeat lock:** `startTunnelSession()` locks sysid/compid from that heartbeat (`MavlinkLink.lockTarget()`). From then on, heartbeats from other systems are ignored, with one console line per system. Only `TUNNEL` frames from the locked target, addressed to 253/25 or 0/0, reach the MSP decoder (`decodeMspTunnelChunk()`).
- **Switch:** `read_serial` and `read_ltm` are detached, so the MSP decoder only sees reassembled tunnel bytes and LTM detection is off. The queue is flushed and put in tunnel mode (see below). The raw `MSP_API_VERSION` still pending would otherwise be answered by the tunnel probe. The transport transform wraps every MSP frame into `TUNNEL` frames. All chunks of one request go out in a single `connection.send()`, well inside the FC's 1 s partial-frame window. A 1 Hz GCS heartbeat is started on its own `setInterval`, because tab switches kill every named interval outside their keep-lists.
- **Probe:** the handshake's `MSP_API_VERSION` goes through the tunnel with `MAVLINK_TUNNEL_PROBE_RETRIES` (2) extra attempts (`MSP.sendWithTunnelRetries()`), because a weak radio link may lose the first request. Every probe attempt waits at least the 3000 ms window cap (`sendWithTunnelRetries(..., minWindowMs)` → `request.tunnelMinWindowMs`), so a first reply slower than the prior or learned window does not fail the handshake.
- **Connecting timeout per step:** a plain MSP link keeps the single 10 s budget armed in `onOpen()`. Over the tunnel, `armTunnelHandshakeStep()` re-arms it before every handshake request to (retries + 1) × 3000 ms (the window cap) plus a 3000 ms margin (`TUNNEL_HANDSHAKE_STEP_MARGIN_MS`): 12 s for the probe with its 2 retries, 9 s for each following step. On expiry the log names the actual seconds (`mavlinkTunnelNoConfigurationReceived`).
- **Handshake:** the handshake is the same as on USB: `MSP_API_VERSION` → `MSP_FC_VARIANT` → `MSP_FC_VERSION` → `MSP_NAME` → `MSP_BUILD_INFO` → `MSP_BOARD_INFO` → `MSP_UID`, followed in `onConnect()` by `MSP_BOXIDS` and `MSP_DATAFLASH_SUMMARY`. The queue ends a lost tunnel request with `onFinish(false)`, and `isTunnelReplyLost()` then aborts instead of continuing with stale FC state. `sendTunnelHandshake()` sets `GUI.tunnelHandshakePending`; `endTunnelHandshake()` clears it on every exit: after `MSP_UID`, in `abortConnecting()` and in `endMavlinkSession()`.

What is refused in a tunnel session:

- **CLI:** the MSP tunnel does not carry it. A wrong firmware variant or version normally opens a CLI-only session; over the tunnel it logs `mavlinkTunnelNoCli` and disconnects (`refuseCliOverTunnel()`).
- **Tabs:** `GUI.tabsUnavailableOverMavlinkTunnel` (`cli`, `sensors`; the sensors tab polls faster than the tunnel can answer) is removed from `GUI.allowedTabs`, and the tab-click handler in `js/configurator_main.js` logs `tabSwitchMavlinkTunnelUnavailable`. While `GUI.tunnelHandshakePending` is set (first connect and after a reboot), the handler refuses a tab switch and logs `mavlinkTunnelHandshakePendingTabRefused`: a tab switch would abandon the handshake's requests.
- **LTM:** the listener is detached (see above).

Failure messages (keys in `locale/en/messages.json`):

| Key | When |
|---|---|
| `mavlinkTunnelNoReply` | The FC heartbeat was seen but no probe attempt was answered ("needs INAV 10.0 or later with mavlink_version 2") |
| `mavlinkTunnelV1Only` | The 10 s connecting timeout expired with only MAVLink 1 heartbeats seen |
| `mavlinkTunnelNoConfigurationReceived` | A handshake step's connecting timeout expired in a tunnel session; names its seconds |
| `mavlinkTunnelLostReply` | A handshake read was lost after its retry; disconnects |
| `mavlinkTunnelSkippedPlainMsp` | Heartbeat seen, but the port answered plain MSP; stays on MSP |
| `mavlinkTunnelNoCli` | The session would have fallen back to CLI-only |
| `mavlinkTunnelHandshakePendingTabRefused` | A tab was clicked while the tunnel handshake was running |

The status bar shows the link type (`linkTypeMsp`, `linkTypeMavlinkTunnel`, and `linkTypeMavlinkTunnelTelemetry` once the first virtual reply was served).

## Scheduler rules in tunnel mode

`mspQueue.setTunnelMode(true, serialBaud)` (`js/serial_queue.js`) changes the scheduler as follows. Every rule traces back to the firmware contract above.

- **One request in flight.** The FC has one parser per port and replies carry no request id, so a second request in flight could not be matched and could corrupt the first. The lock method is forced to `hard`. `isLocked()` stays true while `tunnelPending` is set. The balancer does not force-free the hard lock while a tunnel request is pending. `freeHardLockAfterFrame()` keeps an unrelated frame from releasing the slot. The timer is kept off `request.timer`, because `MSP.callbacks_cleanup()` clears that on every tab switch and would leave the slot locked forever. Leaving tunnel mode restores the lock method the user chose meanwhile (Wireless mode checkbox).
- **Silence timeout, restarted per chunk.** Each received chunk calls `notifyTunnelProgress()`, so a long multi-chunk reply is not cut off while a lost chunk is still detected. The Configurator's own connection timeout is not used in tunnel mode.
- **The silence window adapts to the link** (`tunnelSilenceWindowMs()`): `clamp(max(prior, learned), 500 ms, 3000 ms)`. A reply queues behind whatever telemetry the FC already put into its 255-byte TX ring. At 4800 baud the ring alone takes 531 ms to drain, and a fixed 500 ms window turned late replies into false losses, retries and duplicates, even with nothing but the port's default streams. No chunk was lost on that path in the measurement, which ran a firmware whose reply chunks wait for TX room (iNavFlight/inav#12036). Firmware without that fix (10.0.0-rc1) drops a chunk that does not fit (see above); the retry covers it.
  - **Prior**, set by `setTunnelMode()`: for a serial port, the time to drain the TX ring (255 bytes), one reply chunk (145) and the request (60) at 10 bits per byte, plus 200 ms. That is 1158 ms at 4800 baud, 679 ms at 9600, and the 500 ms floor from 19200 up. `serial_backend.js` passes `CONFIGURATOR.connection.bitrate`, the value `getTimeout()` and the status-poll interval use, for a serial connection only. TCP, UDP and BLE report a nominal 115200 whatever radio sits behind them, so they start at 500 ms. The serial baud only stands in for the FC's UART rate: it is right when the Configurator's port is that UART (e.g. through a transparent serial radio at the same rate), and meaningless behind a USB-CDC radio module, whose port setting says nothing about the air link. The learned part covers that case.
  - **Learned:** 1.5 × the largest latency seen, as a decaying maximum. It takes the first-chunk latency and every gap between chunks of each answered request, except slow codes (their reply waits for the blocking handler). For a retry, the first chunk may be an earlier attempt's reply, so measured from the retry it is a lower bound. Chunk timing restarts when a partial reply is dropped (lapse, reassembly timeout), so a stray chunk cannot turn a wait into a gap. A window of 3 × the average RTT was measured and still timed out, because the average sags between bursts.
  - **Every stale reply** raises it at once to 1.5 × its lateness since its request was sent, except for slow codes. For the duplicate after a retry, the answer the retry took counts too, measured from the earlier attempt: the duplicate proves that answer was the earlier attempt's late reply.
  - **Decay:** 10 % per full minute without a stale reply, never below the prior. A lapse without a reply does not hold it: a real loss says nothing about lateness. The learned value is stored capped at 3000 ms. A change is logged on the console; `mspQueue.getTunnelSilenceWindow()` returns the current value. The learned value survives a reboot-back (`mspQueue.resetTunnelRequests()` drops only the pending request and the stale watches); only a new session resets it (`setTunnelMode()`).
- **Long first window for slow handlers** (`TUNNEL_SLOW_REQUEST_CODES`: handlers that block before replying, well over a second before the first reply byte). These write the config flash and get 5 s (`TUNNEL_SLOW_REQUEST_TIMEOUT_MS`, or the silence window if that is longer): `MSP_EEPROM_WRITE`, `MSP_SELECT_SETTING`, `MSP_RESET_CONF`, `MSP_WP_MISSION_SAVE`, `MSP2_INAV_SELECT_BATTERY_PROFILE`, `MSP2_INAV_SELECT_MIXER_PROFILE`. `MSP_DATAFLASH_ERASE` gets its own 40 s (`TUNNEL_ERASE_TIMEOUT_MS`): NAND has no chip erase, so the driver erases block by block (W25N02KV and MX35LF2G: 2048 blocks, waiting up to 15 ms each, about 31 s). `MSP_SET_REBOOT` is in the set with 5 s (the plain path's `getTimeout()` also gives it 5 s), although its handler does not block. Chunk progress never shortens the long window.
- **One retry, none for reboot or erase.** A lapsed request is retried once as a whole (`TUNNEL_DEFAULT_RETRIES`), with fresh MAVLink framing and at the front of the queue, so a later write cannot overtake it. `MSP_SET_REBOOT` and `MSP_DATAFLASH_ERASE` get no retry: the FC replies and then reboots, so a resend after a lost reply would reboot the freshly started FC a second time, and a resent erase would run the whole erase again. Callers can set their own budget: the probe has 2 retries, the reboot monitor's liveness probe 0 and its uptime read 1.
- **Decoder reset.** On every lapse, `resetDecoders()` resets the MSP decoder (`MSP.resetDecoder()`) and the link's reassembly clock. A lost chunk leaves the decoder mid-frame, and the next reply would otherwise be eaten as its payload. `MavlinkLink` also resets the MSP decoder when a chunk arrives `max(1000 ms, current silence window)` or more after the previous one (`reassemblyTimeoutMs`, supplied by `serial_backend.js`). The queue waits a whole silence window per chunk, so reassembly must not give up earlier; the 1000 ms floor mirrors the FC's `MAVLINK_TUNNEL_MSP_TIMEOUT_MS`.
- **Stale watch after a lapse.** `watchStale()` opens a one-shot watch, one silence window long, for the lapsed code. A late reply of the lapsed attempt that arrives while nothing of that code is pending is dropped (`admitReply()` returns false). While the window is open, the next non-retry request of that code is held at the head of the queue. Nothing overtakes it, so FIFO order (and write order) is kept. The retry itself is not held back, and a late reply arriving while the retry is pending answers the retry.
- **Stale watch after a retried request (the misattribution case).** Take a read of `MSP_WP` for waypoint 3 whose first attempt lapses. The retry goes out, and the late reply of attempt 1 answers it. The retry's own reply can still follow, as late as the first one was. If the next request is `MSP_WP` for waypoint 4, that duplicate (waypoint 3 data) would be taken as its answer. `updateWatchOnAnswer()` therefore opens a duplicate watch of `min(max(2 s, window), time-to-answer + window)`. During it, a same-code request with a different payload, or any same-code request after a write went out, is held back until the duplicate arrives (and is dropped) or the window ends. An identical re-read with no write in between is deliberately not held, so a 20 Hz poller recovers within the burst. It may take the duplicate, which is the same query one poll older, and then its own reply becomes the expected duplicate.
- **Coalescing.** `mspDeduplicationQueue` already rejects a request whose code is queued or in flight. In tunnel mode, `MSP._enqueue()` then calls `mspQueue.coalesce()`, which attaches an identical read (same code, same payload) to the queued or in-flight request, never to one abandoned by a tab switch (its reply fires no callback). This replaces a put-retry chain per rejected poll. Each caller gets its own `DataView`, because readers keep their offset on it. **Write guard:** a read is never shared when a write is queued behind it, because a re-read after a SET needs post-SET data. Writes never coalesce.
- **Round-trip samples** (`roundtripSample()`) are measured from the last send and skipped for retried or held-back requests, so the silence window does not inflate the RTT shown in the status bar.
- **Tab switch.** `callbacks_cleanup()` calls `abandonPending()`. The pending request keeps the slot until its reply or timeout, but gets no retry and no callback.

## Lost requests

When the retry budget is used up, `MSP.handleTunnelRequestLost()` (`js/msp.js`) decides what the caller sees.

**Lost read.** The read's FC state is stale, so the write that hands it back must not be sent. The code and request payload go into `MSP.lostReplies` (keyed by payload: a good read of WP 4 does not unblock a lost WP 3). `blockedWriteSource()` then refuses the paired write, like after a parse failure, and logs `mspWriteBlockedAfterLostReply`. The entry clears when the same read with the same payload is answered and parsed again. The first loss of a code that feeds a write is also logged (`mspTunnelReplyLost`); status-poll losses are not. The caller gets `onFinish(false)`.

**Lost write.** The caller gets **no callback**, as with a refused write. Most callers ignore the callback argument, and a save chain would otherwise go on to `MSP_EEPROM_WRITE` and `MSP_SET_REBOOT` as if the write had landed. The user is told `mspTunnelWriteLost` ("reload the tab, then save again"), except for live-control writes (`MSP_SET_MOTOR`, `MSP_SET_RAW_RC`, `MSP_SET_RAW_GPS`, `MSP_SET_HEAD`, `MSP_SET_RTC`). The recovery hook `onWriteLost()` in `js/serial_backend.js` then:

- closes the defaults dialog's saving modal (`defaultsDialog.abortSaving()`);
- triggers `GUI.EVENT_MSP_WRITE_LOST` on `document` (Mission Control re-enables its save buttons on it);
- restarts status polling that a save flow had paused.

Why a hook and not an error path in the chain: `MSPChainerClass` (`js/msp/MSPchainer.js`) is older than the tunnel and has no error or timeout path. A step whose callback never fires stops the chain silently, and whatever the chain had disabled stays disabled. A new save flow that pauses or disables UI must listen for `GUI.EVENT_MSP_WRITE_LOST` and undo it there.

Requests of the reboot monitor (`rebootTracked`, `linkProbe`) bypass all of this. They get `onFinish(false)` and are not recorded as lost, because their loss means "FC down", not "state stale".

## Telemetry feed

With the feed on, `startTelemetryFeed()` creates a `MavlinkTelemetryFeed` after `MSP_UID`. It sets `MSP.virtualReplies`, and `MSP.send_message()` asks it first.

**Covered reads** (`TELEMETRY_COVERED` in `js/mavlink/mavlinkTelemetryFeed.js`), answered only when sent without a payload:

| MSP code | MAVLink source |
|---|---|
| `MSP_ATTITUDE` | `ATTITUDE` |
| `MSP_RAW_GPS` | `GPS_RAW_INT` |
| `MSP_ALTITUDE` | `VFR_HUD` (altitude only) |
| `MSPV2_INAV_ANALOG` | `BATTERY_STATUS`, `SYS_STATUS`, `RC_CHANNELS` (rssi) |
| `MSP_RC` | `RC_CHANNELS` |

`MavlinkTelemetry` writes the same fields in the same units as MSPHelper's handlers, so a tab cannot tell a virtual reply from a wire reply. `SYS_STATUS` also drives the sensor icons.

**When a read is served virtually** (`_fallbackReason()`). Otherwise it goes on the wire:

- **Seed and refresh:** the code was answered over the wire this session, less than `WIRE_REFRESH_MS` (10 s) ago, and it is not in `lostReplies` or `parseFailures`. Fields MAVLink does not carry keep their last MSP value, so there must be a recent one. The stamp is taken in `noteWireReply()`, only for a reply that answered its own request.
- **Acknowledged:** every source message's interval was acknowledged.
- **Fresh:** every source message was seen within `max(3 × interval, 3 s)`, with the slower of the acknowledged and the requested interval, so a stream just slowed down is judged at its new rate. A source that is not requested (or requested at interval −1) counts as off (`_isOff()`) and is skipped for a code with other sources; a code whose only source is off goes on the wire.
- **RC channel count:** `MSP_RC` stays on the wire when `RC_CHANNELS.chancount` exceeds 18.

A virtual reply fires its callbacks on the next tick. A tab switch cancels those that have not fired yet (`cancelPending()`). Each fallback reason other than the refresh is logged once per code.

**`MSP_SENSOR_STATUS` stays on the wire.** It is the only MSP command that sets the FC's `isMspConfigActive()` (`fc_msp.c`), and that flag lapses 1000 ms after the last call (`fc_core.c`). With `blackbox_arm_control = -1`, blackbox logging starts and stops on this flag. In tunnel mode, with or without the feed, `js/periodicStatusUpdater.js` therefore polls `MSP_SENSOR_STATUS` every 500 ms, and `MSPV2_INAV_STATUS` plus `MSPV2_INAV_ANALOG` every second run (1 Hz). `MSP_ACTIVEBOXES` is not polled in tunnel mode, because `MSPV2_INAV_STATUS` carries the same box bitmask (`applyInavStatusBoxModes()` in MSPHelper). A plain MSP link keeps its four requests per run at the baud-rate interval.

**Streams are requested explicitly.** A MAVLink port other than port 1 streams only `HEARTBEAT`, `MISSION_CURRENT` (1 Hz) and arming `STATUSTEXT` by default (`docs/Mavlink.md`, "Relevant CLI settings"), and a radio link is not necessarily port 1. `BASE_INTERVALS_US` requests `SYS_STATUS`, `ATTITUDE`, `VFR_HUD` and `GPS_RAW_INT` at 2 Hz, and `BATTERY_STATUS` and `RC_CHANNELS` at 1 Hz. The requests use `COMMAND_LONG` / `MAV_CMD_SET_MESSAGE_INTERVAL`, sent directly on the connection rather than through the MSP queue. `MavlinkStreamControl` rules:

- **One command in flight:** `COMMAND_ACK` names the command but not the message id it answers.
- **Pacing:** 50 ms spacing between commands. After a command needed its resend or went unanswered, the next command waits one ack timeout instead: a late ack of the earlier attempt then finds nothing in flight and is discarded, instead of being credited to the next message id.
- **Ack timeout:** `max(500 ms, 3 × RTT)`, then one resend. An accepted interval recorded before the send does not cancel the resend; only its rate observed while the command is in flight does.
- **Collapsing:** queued commands for one id collapse, and an unchanged interval is not sent again. After a command went out without an ack, the FC may run either interval (`isUnconfirmed()`), so the next change for that id is always sent, even back to the accepted one.
- **Implicit ack, speed-ups only:** a message observed at 0.8 to 1.25 × a requested higher rate over one implicit-ack window counts as acknowledged even if the ack was lost. The window is `max(2 s, 4 requested intervals)` (`implicitAckWindowMs()`), so a 0.5 Hz stream can be told from a 1 Hz one. After a command went unanswered, the base result waits the same window for this proof. The FC reschedules one interval after each send, so streams run slightly slow. A slowdown (a longer interval than the accepted one, e.g. an unboost) is confirmed by its explicit ack only: frames at the old, faster rate cannot tell a command that arrived from one that did not. A queued command is sent even when its rate was observed before it went out.
- **Re-request,** at most once per 10 s per message and six times per message (`MAX_RE_REQUESTS`, one log line when reached), each with the usual two attempts. The first FC frame after at least 3 s without one (`FC_SILENCE_MS`) refills the budget, because the FC may have rebooted and dropped every override. While the FC is silent, no re-request pass runs: its commands could not reach it. Re-requested are:
  - an accepted stream that goes quiet (an FC reboot drops every override). After an FC silence, a stream counts as quiet only once it missed one full fresh window measured from the silence end (`_silenceEndedAt`): a link fade or a blocking erase keeps the overrides;
  - an interval still unconfirmed 10 s after it went out, boost included, also when it equals the accepted one (the stream control gives up after two unanswered attempts, and a busy link drops acks);
  - an accepted stream never received within its fresh window after the command went out, because `COMMAND_ACK` names no message id and may belong to another command. At most twice (`NEVER_SEEN_RE_REQUESTS`, refilled with the other budget after an FC silence): the FC accepts messages it does not send, e.g. `GPS_RAW_INT` without a GPS.

The base result is logged as `mavlinkTelemetryStreamsActive`, with the number of base streams the FC confirmed (accepted interval > 0, `_streamsDone()`), or as `mavlinkTelemetryNoAck` when there is none.

**Boost/unboost:** three virtual `MSP_ATTITUDE` or `MSP_RC` serves within 1 s raise `ATTITUDE` or `RC_CHANNELS` to 10 Hz. After 2 s without such a request, they drop back to their interval in the base set.

**Bandwidth guard.** Push telemetry does not pace itself, so the feed keeps its own traffic small and simple:

- **Boost on demand, unboost on idle** (above). A boost runs at whatever the link delivers; nothing judges or backs it off. On a slow link it simply delivers less than 10 Hz.
- **Unconfirmed commands are requested again** (see Re-request above), so a boost or unboost lost with its acks does not leave the FC at the wrong rate for the session.
- **Slow serial start** (`REDUCED_INTERVALS_US`): when the session runs on a serial port at 9600 baud or less (`mspQueue.hasSlowSerialPrior()`, from the baud passed to `setTunnelMode()`), the feed starts with the reduced set and never boosts, and logs this once. The reduced set has `SYS_STATUS`, `ATTITUDE` and `GPS_RAW_INT` at 1 Hz and `VFR_HUD` and `BATTERY_STATUS` at 0.5 Hz. It does not request `RC_CHANNELS` at all, rather than switching it off, because the FC would keep that override until its next reboot. A stream never requested counts as off, so `MSP_RC` goes on the wire. The port's own RC rate applies: `mavlink_port1_rc_chan_rate` on the first MAVLink port (default 1 Hz, about 54 B/s, about 11 % of 4800 baud), none on the others. `ANALOG.rssi` comes from those `RC_CHANNELS` frames where the port sends them, otherwise from the 10 s wire refresh. At 4800 baud (480 B/s) the base set (about 370 B/s) plus a boost (about 680 B/s) overran the FC's TX ring and cost multi-chunk replies. The reduced set is used only from the start; nothing switches to it later. Anything else a user finds too slow is covered by the feed switch below.

**Restore before disconnect:** `stopTelemetryFeed(true, done)` sends interval 0 for every message id it touched. In the firmware, interval 0 clears the override, back to the port's default. The frames go out one at a time, 20 ms apart, and the port closes after the last write callback or after a 300 ms deadline. Without a restore, the FC keeps the Configurator's intervals until its next reboot. During a reboot and on session teardown, the feed stops without a restore.

**Known approximations** (telemetry value compared with the MSP value):

| Field | Difference |
|---|---|
| `ANALOG.rssi` | `RC_CHANNELS.rssi` is `scaleRange(rssi, 0, 1023, 0, 254)` on the FC. Scaled back, it lands within ±4 of the MSP value. 255 (unknown) leaves the MSP value. |
| `ANALOG.cell_count` | Counted from the `BATTERY_STATUS` voltage entries. While the FC has 0 cells detected, it sends the pack voltage as one entry, which reads as 1 cell above 2.2 V. |
| `ANALOG.amperage` | −1 means "not measured" on MAVLink, so a real −0.01 A reads 0. |
| `ANALOG.power` | Computed from the `SYS_STATUS` voltage and current. The FC computes it from the raw vbat, but `SYS_STATUS` carries `getBatteryVoltage()`, which is sag-compensated when that voltage source is selected. |
| `ANALOG.voltage` | `SYS_STATUS` voltage is uint16 mV and wraps above 65.535 V. It is unwrapped with the `BATTERY_STATUS` cell sum and keeps its MSP value until one arrived. |
| `SENSOR_DATA.air_speed` | Not taken from `VFR_HUD`: the FC sends 0 there unless the pitot is healthy, while `MSPV2_INAV_AIR_SPEED` sends the estimate. It stays on the wire. |
| `CONFIG.cpuload` | Not taken from `SYS_STATUS` (clamped at 100 %). `MSPV2_INAV_STATUS` stays the only writer. |
| Not on MAVLink | `battery_state`, `battery_remaining_capacity`, capacity flags, `mWhdrawn` (the firmware's `energy_consumed` unit is not trustworthy), `barometer`, `hdop`. These come from the 10 s wire refresh. |

## Reboot confirmation

Over USB, the port drops when the FC reboots, and `GUI.handleReconnect()` reconnects after 5 s. A tunnel link survives the reboot. The FC flushes the reply before rebooting, so a missing reply can mean either a lost request or a lost reply. In tunnel mode, `GUI.handleReconnect()` only records which tab to reopen, and `TunnelRebootMonitor` (`js/mavlink/tunnelRebootMonitor.js`) takes over. `MSP.send_message(MSP_SET_REBOOT)` wraps the caller's callback with `rebootTracker.track()`. A second reboot while one is being confirmed is not sent (`mavlinkTunnelRebootAlreadyRunning`).

On start (`onTunnelRebootStart()`), the monitor:

- opens the reboot modal;
- stops status polling;
- sets `connectionValid = false`;
- stops the feed without a restore.

Any MAVLink frame from the locked target counts as a sign of life (`noteFcActivity()`). Liveness probes are `MSP_API_VERSION` with no retry, at most one at a time, checked every 500 ms; a probe without an answer after one silence window + 1.5 s (`probeWatchdogMs()`) is replaced.

| Case | Rule |
|---|---|
| Reply received | Probing starts. Silence of ≥ 1 s followed by activity → uptime check. If the FC never goes silent for 3 s → uptime check as well: it refused (armed), or rebooted faster than a probe gap. |
| Reply lost (no reply in its 5 s window, which is never retried, or no callback within 10 s) | Probing starts. The first probe answer, or activity after silence → uptime check. |
| Before the reply | Silence counts only after 1.5 s: on a port that streams only heartbeats, 1 s gaps are normal. |

**Uptime rule:** `MSP2_INAV_MISC2` starts with the FC's on-time in seconds (u32, `fc_msp.c`); MSPHelper parses it into `FC.MISC2.onTime` (`null` on an error reply), and the monitor reads that inside its callback. An uptime shorter than the time since the reboot request means the FC rebooted. The uptime is what decides, because a link fade looks like a reboot and a fast reboot can hide between two heartbeats.

**No blind resend:** a lost reply never triggers a resend on its own, since the FC may already have rebooted and a resend would reboot it again. A single resend (`mavlinkTunnelRebootResend`) happens only when the reply was lost and a readable uptime proves the FC did not reboot, meaning the request itself was lost. If the uptime cannot be read (two lost reads, or no answer within 3 silence windows + 1.5 s, `uptimeWatchdogMs()`: 3 s at the 500 ms window):

- after a received reply, a silence verdict stands (rebooted); without silence it counts as not rebooted;
- after a lost reply, probing continues and the next answer reads the uptime again, even after a silence: a link fade looks the same, and the request may never have arrived. Only an uptime reading ends it early; otherwise the 15 s budget does (see Outcomes).

Outcomes:

| Outcome | Message | What happens |
|---|---|---|
| Rebooted | `mavlinkTunnelRebootBack` | The caller's callback has run on the reply, or runs now with a synthetic `{command: MSP_SET_REBOOT}` if the reply was lost, so its dialogs close. `FC.resetState()`, `parseFailures`/`lostReplies` cleared, and the tunnel handshake runs again without closing the port and with the learned silence window kept (`resetTunnelQueue(true)`). The reboot modal stays open, and tab clicks are refused, until the handshake ends (`endTunnelHandshake()`); `onValidFirmware()` then reopens the tab. |
| Not rebooted | `mavlinkTunnelRebootNotRebooted` | A caller whose reply was lost is never called back. The defaults dialog's saving modal is closed, and the session resumes: feed, status polling, tab. |
| Gone (15 s without a verdict) | `mavlinkTunnelRebootNotBack` | Disconnects. If the FC is still answering without a readable uptime, the outcome is "not rebooted" instead: after a received reply only when it never went silent, after a lost reply also when it came back after a silence. After a received reply, an uptime check already running is not cut at 15 s; it ends on its own watchdog (3 silence windows + 1.5 s). |

## Extending

**Adding a MAVLink message:**

1. Add it to `MAVLINK_MSG_ID` and `MESSAGE_INFO` in `js/mavlink/mavlinkProtocol.js`, with `crcExtra`, the full payload `length` (with extensions) and `minLength` (the MAVLink 1 base length). Take the values from the firmware's generated headers (`lib/main/MAVLink`).

The parser rejects any id without an entry, advancing one byte, and `encodeFrameV2()` throws for one. A message missing from the table is therefore never decoded.

**Adding a covered MSP code:**

1. Add a decoder and handler to `MavlinkTelemetry` that write the same `FC.*` fields and units as the MSPHelper case. Leave fields MAVLink does not carry alone.
2. Add the entry to `TELEMETRY_COVERED`.
3. Add the source messages to `BASE_INTERVALS_US`.
4. Optionally add the code to `BOOSTABLE`.
5. Never cover `MSP_SENSOR_STATUS`, and do not cover a read whose FC state is not fully derivable unless the 10 s wire refresh is acceptable for the rest.

**Adding a slow code:** if a new MSP handler blocks before replying (a config flash write, a flash erase), add it to `TUNNEL_SLOW_REQUEST_CODES` in `js/serial_queue.js`. Otherwise its first reply byte arrives after the silence window, and the request is retried while the FC is still busy. A handler that can block longer than 5 s needs its own first window in `startTunnelRequest()`, like `MSP_DATAFLASH_ERASE`; one whose resend would repeat its effect is excluded from retries there as well.

## Testing

`yarn test` runs everything. A single file runs with `node --test tests/<file>`. Most suites load the real `js/serial_queue.js` and `js/msp.js`, with only their import specifiers rewritten (`tests/helpers/mspCore.mjs`), and run on Node's mock timers. The MAVLink golden vectors were packed with the firmware's own MAVLink C library.

| File | Covers |
|---|---|
| `tests/mavlink-parser.test.mjs` | Parser: golden frames, zero-extension, resync after a stray magic byte or CRC error, signed and MAVLink 1 frames, split input, heartbeat filter |
| `tests/mavlink-tunnel.test.mjs` | TUNNEL codec byte-for-byte against the firmware, reply filter, multi-chunk reassembly into `MSP.read`, gap reset at 1000 ms or at the window from `reassemblyTimeoutMs` |
| `tests/mavlink-command.test.mjs` | `COMMAND_LONG`/`COMMAND_ACK` codecs, stream control: one in flight, resend, collapse, implicit ack (speed-ups only, window of four intervals for slow streams), RTT-scaled timeout, re-request, send time, refusal, change after an unconfirmed send |
| `tests/mavlink-telemetry.test.mjs` | MAVLink → `FC.*` per message, compared with what `fc_msp.c` would send; the approximations above |
| `tests/msp-tunnel-scheduler.test.mjs` | Tunnel mode: one in flight, silence timer, adaptive window (prior per baud, learned from slow and stale replies, decay, cap, slow codes excluded), retry budgets, probe window floor, slow window, 40 s erase window without resend, learned window kept by `resetTunnelRequests()`, stale watches, misattribution, coalescing and its write guard, lost-read blocking, loss-burst recovery, decoder reset, tab switch |
| `tests/msp-tunnel-write-lost.test.mjs` | Lost write: no callback, one message per write, recovery hook, no message for live writes or lost reads |
| `tests/msp-tunnel-reboot.test.mjs` | Every reboot-monitor case against a fake FC: fades, fast reboots, lost request/reply/uptime, armed refusal, single resend, watchdogs on a wide silence window, uptime check past 15 s after a received reply |
| `tests/msp-virtual-reply.test.mjs` | Feed: seed, freshness, ack, 10 s refresh, `MSP_SENSOR_STATUS` never virtual, boost/unboost, unconfirmed and never-received re-requests, re-request budget and quiet rule after an FC silence, slow serial start, cancel on tab switch, restore on disconnect, feed off |
| `tests/periodic-status-tunnel.test.mjs` | Polling cadence for plain MSP, tunnel with feed, tunnel without feed |
| `tests/msp-status-box-modes.test.mjs` | Box bitmask parsed from `MSPV2_INAV_STATUS` |

**SITL.** Use an INAV 10 SITL. By default its UART2 is an MSP port (`src/main/target/SITL/config.c`). Make it MAVLink-only in the CLI with `serial 1 256 …` (function mask 256 = `FUNCTION_TELEMETRY_MAVLINK`, other fields unchanged), `feature TELEMETRY` (not in the SITL default features) and `save`. SITL exposes UARTn on TCP port 5760 + n − 1, so connect the Configurator with Manual/TCP to `127.0.0.1:5761`. Detection, handshake, the feed and lost chunks (e.g. a proxy that drops frames) can all be exercised this way.

SITL's `systemReset()` closes every socket and re-executes, so a reboot drops the TCP connection, unlike a radio link. To exercise the reboot monitor end to end, put a small relay in between: it listens on a local port for the Configurator and reconnects to 5761 across the reset. No such script is shipped.

## Telemetry feed switch

The Options tab has a "MAVLink telemetry feed" checkbox (store key `mavlink_telemetry_feed`, default on, read once per connect). The feed helps on high-latency radio links, where one MSP round trip costs more than the telemetry does; on a very slow wire with low latency (e.g. 4800 baud), pure MSP polling can be faster. When it is off, the tunnel session stays on MSP polling (the same status cadence as above) and sends no stream commands. While the feed runs, a `console.debug` line every 10 s (the injected logger instead, if one is passed) counts the covered reads that went on the wire and those answered from telemetry.
