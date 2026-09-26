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
| `js/serial_queue.js` | Tunnel mode of the MSP scheduler |
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

On `maintenance-10.x`, reply chunks are written back to back. `mavlinkSendMessage()` in [`mavlink_runtime.c`](https://github.com/iNavFlight/inav/blob/maintenance-10.x/src/main/mavlink/mavlink_runtime.c) drops a frame when the port's TX buffer has no room for it. On a hardware UART, a large reply can therefore lose a chunk. The Configurator treats this as a normal lost reply.

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
- **Probe:** the handshake's `MSP_API_VERSION` goes through the tunnel with `MAVLINK_TUNNEL_PROBE_RETRIES` (2) extra attempts (`MSP.sendWithTunnelRetries()`), because a weak radio link may lose the first request. The 10 s connecting timeout is re-armed.
- **Handshake:** the handshake is the same as on USB: `MSP_API_VERSION` → `MSP_FC_VARIANT` → `MSP_FC_VERSION` → `MSP_NAME` → `MSP_BUILD_INFO` → `MSP_BOARD_INFO` → `MSP_UID`, followed in `onConnect()` by `MSP_BOXIDS` and `MSP_DATAFLASH_SUMMARY`. The queue ends a lost tunnel request with `onFinish(false)`, and `isTunnelReplyLost()` then aborts instead of continuing with stale FC state.

What is refused in a tunnel session:

- **CLI:** the MSP tunnel does not carry it. A wrong firmware variant or version normally opens a CLI-only session; over the tunnel it logs `mavlinkTunnelNoCli` and disconnects (`refuseCliOverTunnel()`).
- **Tabs:** `GUI.tabsUnavailableOverMavlinkTunnel` (`cli`, `sensors`; the sensors tab polls faster than the tunnel can answer) is removed from `GUI.allowedTabs`, and the tab-click handler in `js/configurator_main.js` logs `tabSwitchMavlinkTunnelUnavailable`.
- **LTM:** the listener is detached (see above).

Failure messages (keys in `locale/en/messages.json`):

| Key | When |
|---|---|
| `mavlinkTunnelNoReply` | The FC heartbeat was seen but no probe attempt was answered ("needs INAV 10.0 or later with mavlink_version 2") |
| `mavlinkTunnelV1Only` | The 10 s connecting timeout expired with only MAVLink 1 heartbeats seen |
| `mavlinkTunnelLostReply` | A handshake read was lost after its retry; disconnects |
| `mavlinkTunnelSkippedPlainMsp` | Heartbeat seen, but the port answered plain MSP; stays on MSP |
| `mavlinkTunnelNoCli` | The session would have fallen back to CLI-only |

The status bar shows the link type (`linkTypeMsp`, `linkTypeMavlinkTunnel`, and `linkTypeMavlinkTunnelTelemetry` once the first virtual reply was served).

## Scheduler rules in tunnel mode

`mspQueue.setTunnelMode(true)` (`js/serial_queue.js`) changes the scheduler as follows. Every rule traces back to the firmware contract above.

- **One request in flight.** The FC has one parser per port and replies carry no request id, so a second request in flight could not be matched and could corrupt the first. The lock method is forced to `hard`. `isLocked()` stays true while `tunnelPending` is set. The balancer does not force-free the hard lock while a tunnel request is pending. `freeHardLockAfterFrame()` keeps an unrelated frame from releasing the slot. The timer is kept off `request.timer`, because `MSP.callbacks_cleanup()` clears that on every tab switch and would leave the slot locked forever. Leaving tunnel mode restores the lock method the user chose meanwhile (Wireless mode checkbox).
- **500 ms silence timeout, restarted per chunk** (`TUNNEL_SILENCE_TIMEOUT_MS`). Each received chunk calls `notifyTunnelProgress()`, so a long multi-chunk reply is not cut off while a lost chunk is detected quickly. The Configurator's own connection timeout is not used in tunnel mode.
- **5 s first window for slow handlers** (`TUNNEL_SLOW_REQUEST_TIMEOUT_MS`). These handlers write the config flash before replying, which blocks the FC well over a second before the first reply byte: `MSP_EEPROM_WRITE`, `MSP_SELECT_SETTING`, `MSP_RESET_CONF`, `MSP_WP_MISSION_SAVE`, `MSP2_INAV_SELECT_BATTERY_PROFILE`, `MSP2_INAV_SELECT_MIXER_PROFILE`. `MSP_SET_REBOOT` is in the same set (the plain path's `getTimeout()` also gives it 5 s), although its handler does not write flash. Chunk progress never shortens the long window.
- **One retry, none for reboot.** A lapsed request is retried once as a whole (`TUNNEL_DEFAULT_RETRIES`), with fresh MAVLink framing and at the front of the queue, so a later write cannot overtake it. `MSP_SET_REBOOT` gets no retry: the FC replies and then reboots, so a resend after a lost reply would reboot the freshly started FC a second time. Callers can set their own budget: the probe has 2 retries, the reboot monitor's liveness probe 0 and its uptime read 1.
- **Decoder reset.** On every lapse, `resetDecoders()` resets the MSP decoder (`MSP.resetDecoder()`) and the link's reassembly clock. A lost chunk leaves the decoder mid-frame, and the next reply would otherwise be eaten as its payload. `MavlinkLink` also resets the MSP decoder when a chunk arrives 1000 ms or more after the previous one, mirroring the FC's partial-frame timeout.
- **Stale watch after a lapse.** `watchStale()` opens a one-shot 500 ms window for the lapsed code. A late reply of the lapsed attempt that arrives while nothing of that code is pending is dropped (`admitReply()` returns false). While the window is open, the next non-retry request of that code is held at the head of the queue. Nothing overtakes it, so FIFO order (and write order) is kept. The retry itself is not held back, and a late reply arriving while the retry is pending answers the retry.
- **Stale watch after a retried request (the misattribution case).** Take a read of `MSP_WP` for waypoint 3 whose first attempt lapses. The retry goes out, and the late reply of attempt 1 answers it. The retry's own reply can still follow, as late as the first one was. If the next request is `MSP_WP` for waypoint 4, that duplicate (waypoint 3 data) would be taken as its answer. `updateWatchOnAnswer()` therefore opens a duplicate watch of `min(2 s, time-to-answer + 500 ms)`. During it, a same-code request with a different payload, or any same-code request after a write went out, is held back until the duplicate arrives (and is dropped) or the window ends. An identical re-read with no write in between is deliberately not held, so a 20 Hz poller recovers within the burst. It may take the duplicate, which is the same query one poll older, and then its own reply becomes the expected duplicate.
- **Coalescing.** `mspDeduplicationQueue` already rejects a request whose code is queued or in flight. In tunnel mode, `MSP._enqueue()` then calls `mspQueue.coalesce()`, which attaches an identical read (same code, same payload) to the queued or in-flight request. This replaces a put-retry chain per rejected poll. Each caller gets its own `DataView`, because readers keep their offset on it. **Write guard:** a read is never shared when a write is queued behind it, because a re-read after a SET needs post-SET data. Writes never coalesce.
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
- **Fresh:** every source message was seen within `max(3 × interval, 3 s)`.
- **RC channel count:** `MSP_RC` stays on the wire when `RC_CHANNELS.chancount` exceeds 18.

A virtual reply fires its callbacks on the next tick. A tab switch cancels those that have not fired yet (`cancelPending()`). Each fallback reason other than the refresh is logged once per code.

**`MSP_SENSOR_STATUS` stays on the wire.** It is the only MSP command that sets the FC's `isMspConfigActive()` (`fc_msp.c`), and that flag lapses 1000 ms after the last call (`fc_core.c`). With `blackbox_arm_control = -1`, blackbox logging starts and stops on this flag. In tunnel mode with the feed, `js/periodicStatusUpdater.js` therefore polls `MSP_SENSOR_STATUS` every 500 ms, and `MSPV2_INAV_STATUS` plus `MSPV2_INAV_ANALOG` every second run (1 Hz). `MSP_ACTIVEBOXES` is not polled in tunnel mode, because `MSPV2_INAV_STATUS` carries the same box bitmask (`applyInavStatusBoxModes()` in MSPHelper).

**Streams are requested explicitly.** A MAVLink port other than port 1 streams only `HEARTBEAT` by default (`docs/Mavlink.md`, "Relevant CLI settings"), and a radio link is usually not port 1. `BASE_INTERVALS_US` requests `SYS_STATUS`, `ATTITUDE`, `VFR_HUD` and `GPS_RAW_INT` at 2 Hz, and `BATTERY_STATUS` and `RC_CHANNELS` at 1 Hz. The requests use `COMMAND_LONG` / `MAV_CMD_SET_MESSAGE_INTERVAL`, sent directly on the connection rather than through the MSP queue. `MavlinkStreamControl` rules:

- **One command in flight:** `COMMAND_ACK` names the command but not the message id it answers.
- **Pacing:** 50 ms spacing between commands.
- **Ack timeout:** `max(500 ms, 3 × RTT)`, then one resend.
- **Collapsing:** queued commands for one id collapse, and an unchanged interval is not sent again.
- **Implicit ack:** a message observed at ≥ 0.8 × the requested rate for 2 s counts as acknowledged even if the ack was lost. The FC reschedules one interval after each send, so streams run slightly slow.
- **Re-request:** an accepted stream that goes quiet is requested again, at most once per 10 s per message. An FC reboot drops every override.

The base result is logged as `mavlinkTelemetryStreamsActive` or `mavlinkTelemetryNoAck`.

**Boost/unboost:** three virtual `MSP_ATTITUDE` or `MSP_RC` serves within 1 s raise `ATTITUDE` or `RC_CHANNELS` to 10 Hz. After 2 s without such a request, they drop back to the base rate.

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

Any MAVLink frame from the locked target counts as a sign of life (`noteFcActivity()`). Liveness probes are `MSP_API_VERSION` every 500 ms with no retry.

| Case | Rule |
|---|---|
| Reply received | Probing starts. Silence of ≥ 1 s followed by activity → uptime check. If the FC never goes silent for 3 s → uptime check as well: it refused (armed), or rebooted faster than a probe gap. |
| Reply lost (no reply in its 5 s window, which is never retried, or no callback within 10 s) | Probing starts. The first probe answer, or activity after silence → uptime check. |
| Before the reply | Silence counts only after 1.5 s: on a port that streams only heartbeats, 1 s gaps are normal. |

**Uptime rule:** `MSP2_INAV_MISC2` starts with the FC's on-time in seconds (u32, `fc_msp.c`); MSPHelper parses it into `FC.MISC2.onTime` (`null` on an error reply), and the monitor reads that inside its callback. An uptime shorter than the time since the reboot request means the FC rebooted. The uptime is what decides, because a link fade looks like a reboot and a fast reboot can hide between two heartbeats.

**No blind resend:** a lost reply never triggers a resend on its own, since the FC may already have rebooted and a resend would reboot it again. A single resend (`mavlinkTunnelRebootResend`) happens only when the reply was lost and a readable uptime proves the FC did not reboot, meaning the request itself was lost. If the uptime cannot be read (two lost reads, or 3 s):

- a silence verdict stands (rebooted);
- after a received reply, it counts as not rebooted;
- after a lost reply, probing continues, because a resend needs a positive reading.

Outcomes:

| Outcome | Message | What happens |
|---|---|---|
| Rebooted | `mavlinkTunnelRebootBack` | The caller's callback has run on the reply, or runs now with a synthetic `{command: MSP_SET_REBOOT}` if the reply was lost, so its dialogs close. `FC.resetState()`, `parseFailures`/`lostReplies` cleared, and the tunnel handshake runs again without closing the port; `onValidFirmware()` then reopens the tab. |
| Not rebooted | `mavlinkTunnelRebootNotRebooted` | A caller whose reply was lost is never called back. The defaults dialog's saving modal is closed, and the session resumes: feed, status polling, tab. |
| Gone (15 s without a verdict) | `mavlinkTunnelRebootNotBack` | Disconnects. If the FC answered all along without a readable uptime, the outcome is "not rebooted" instead. |

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

**Adding a slow code:** if a new MSP handler writes the config flash before replying, add it to `TUNNEL_SLOW_REQUEST_CODES` in `js/serial_queue.js`. Otherwise its first reply byte arrives after the 500 ms silence timeout, and the request is retried while the FC is still writing.

## Testing

`yarn test` runs everything. A single file runs with `node --test tests/<file>`. Most suites load the real `js/serial_queue.js` and `js/msp.js`, with only their import specifiers rewritten (`tests/helpers/mspCore.mjs`), and run on Node's mock timers. The MAVLink golden vectors were packed with the firmware's own MAVLink C library.

| File | Covers |
|---|---|
| `tests/mavlink-parser.test.mjs` | Parser: golden frames, zero-extension, resync after a stray magic byte or CRC error, signed and MAVLink 1 frames, split input, heartbeat filter |
| `tests/mavlink-tunnel.test.mjs` | TUNNEL codec byte-for-byte against the firmware, reply filter, multi-chunk reassembly into `MSP.read`, 1000 ms gap reset |
| `tests/mavlink-command.test.mjs` | `COMMAND_LONG`/`COMMAND_ACK` codecs, stream control: one in flight, resend, collapse, implicit ack, RTT-scaled timeout, re-request |
| `tests/mavlink-telemetry.test.mjs` | MAVLink → `FC.*` per message, compared with what `fc_msp.c` would send; the approximations above |
| `tests/msp-tunnel-scheduler.test.mjs` | Tunnel mode: one in flight, silence timer, retry budgets, slow window, stale watches, misattribution, coalescing and its write guard, lost-read blocking, decoder reset, tab switch |
| `tests/msp-tunnel-write-lost.test.mjs` | Lost write: no callback, one message per write, recovery hook, no message for live writes or lost reads |
| `tests/msp-tunnel-reboot.test.mjs` | Every reboot-monitor case against a fake FC: fades, fast reboots, lost request/reply/uptime, armed refusal, single resend |
| `tests/msp-virtual-reply.test.mjs` | Feed: seed, freshness, ack, 10 s refresh, `MSP_SENSOR_STATUS` never virtual, boost/unboost, cancel on tab switch, restore on disconnect, feed off |
| `tests/periodic-status-tunnel.test.mjs` | Polling cadence for plain MSP, tunnel with feed, tunnel without feed |
| `tests/msp-status-box-modes.test.mjs` | Box bitmask parsed from `MSPV2_INAV_STATUS` |

**SITL.** Use an INAV 10 SITL. By default its UART2 is an MSP port (`src/main/target/SITL/config.c`). Make it MAVLink-only in the CLI with `serial 1 256 …` (function mask 256 = `FUNCTION_TELEMETRY_MAVLINK`, other fields unchanged), `feature TELEMETRY` (not in the SITL default features) and `save`. SITL exposes UARTn on TCP port 5760 + n − 1, so connect the Configurator with Manual/TCP to `127.0.0.1:5761`. Detection, handshake, the feed and lost chunks (e.g. a proxy that drops frames) can all be exercised this way.

SITL's `systemReset()` closes every socket and re-executes, so a reboot drops the TCP connection, unlike a radio link. To exercise the reboot monitor end to end, put a small relay in between: it listens on a local port for the Configurator and reconnects to 5761 across the reset. No such script is shipped.

## Temporary A/B switch

The Options tab has a "MAVLink telemetry feed (experimental)" checkbox (store key `mavlink_telemetry_feed`, read once per connect). When it is off, the tunnel session stays on pure MSP polling at 1 Hz. The checkbox and everything marked `// phase-2 A/B` (including the 10 s wire/virtual counter on the console) are removed before merge.
