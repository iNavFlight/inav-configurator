import { mixer } from './model';
import { canSetEscDirection, escDirectionPayload } from './escDirection';

export function mountEscDirection({ MSP, MSPCodes, FC, i18n, interval, isArmed }) {
    // Use INAV's platform classification, including tricopters. Motor count alone
    // would also expose this workflow on multi-engine airplanes.
    const multirotor = FC.isMultirotor();
    $('#esc-direction-panel').prop('hidden', !multirotor);
    if (!multirotor) return () => {};

    let disposed = false, status = null, updatedAt = 0, pending = null, requesting = false;
    let selected = 0, mode = null, held = false, starting = false, stopping = false, lastTestToken = 0;
    const known = [], checked = [];
    const dialog = document.getElementById('esc-direction-dialog');
    const t = (key, args) => i18n.getMessage(key, args);
    const message = key => $('#esc-direction-status').text(t(key));
    FC.ESC_DIRECTION = null;

    function permitted() {
        return !starting && !stopping && !held && canSetEscDirection({ status,
            acknowledged: $('#esc-direction-ack').prop('checked'), armed: isArmed(),
            testing: $('#motorsEnableTestMode').prop('checked'), busy: Boolean(pending),
            fresh: Date.now() - updatedAt < 1500, motor: selected });
    }
    function refresh() {
        const supported = status?.supportsTest && status.count > 0;
        $('#esc-direction-open').prop('disabled', !supported);
        $('#esc-direction-availability').text(supported ? '' : t('escWizardUnsupported'));
        const ready = supported && permitted();
        $('#esc-mode-wizard, #esc-mode-individual').prop('disabled', !ready);
        $('#esc-direction-normal, #esc-direction-reverse, #esc-direction-toggle, #esc-wizard-next').prop('disabled', !ready);
        // Do not disable the held control: it must retain its pointer/key release handler.
        $('#esc-direction-test').prop('disabled', !held && !ready).toggleClass('running', starting || Boolean(status?.testActive));
        $('#esc-wizard-motors button').prop('disabled', !ready || mode === 'wizard');
        $('#esc-wizard-progress').text(mode === 'wizard' ? t('escWizardStep', [selected + 1, status?.count]) : t('escWizardIndividual'));
        $('#esc-wizard-motor').text(t('escWizardSelected', [selected + 1]));
        $('#esc-wizard-next').text(t(selected === status?.count - 1 ? 'escWizardFinish' : 'escWizardNext'));
        $('#esc-direction-normal, #esc-direction-reverse').prop('hidden', mode !== 'individual');
        $('#esc-direction-toggle, #esc-wizard-next').prop('hidden', mode !== 'wizard');
        $('#esc-direction-toggle').prop('disabled', !ready || known[selected] === undefined);
        $('#esc-direction-normal').attr('aria-pressed', String(known[selected] === 0));
        $('#esc-direction-reverse').attr('aria-pressed', String(known[selected] === 1));
        $('#esc-wizard-motors button').each(function () {
            const motor = Number($(this).data('motor'));
            $(this).toggleClass('selected', motor === selected).toggleClass('checked', Boolean(checked[motor]))
                .attr('aria-pressed', String(motor === selected));
        });
    }
    function drawMotors() {
        const image = $('#motor-mixer-preview-img').attr('src');
        $('#esc-wizard-image').attr('src', image || '');
        const rules = FC.MOTOR_RULES.get();
        // INAV's existing Outputs diagram labels only Quad X; do not invent
        // motor positions for custom/stacked mixers. Those get numbered controls.
        const spatial = status.count === 4 && mixer.getById(FC.MIXER_CONFIG.appliedMixerPreset)?.image === 'quad_x' && rules.length >= 4;
        $('#esc-wizard-map').toggleClass('numbered', !spatial);
        const $motors = $('#esc-wizard-motors').empty();
        for (let motor = 0; motor < status.count; motor++) {
            const $button = $('<button type="button">').text(motor + 1).data('motor', motor)
                .attr('aria-label', t('escWizardSelected', [motor + 1]));
            if (spatial) $button.css({ left: `${rules[motor].getRoll() < 0 ? 80 : 20}%`, top: `${rules[motor].getPitch() > 0 ? 80 : 20}%` });
            $button.on('click.escDirection', () => {
                if (mode !== 'individual' || !permitted()) return;
                selected = motor;
                refresh();
            });
            $motors.append($button);
        }
    }
    function poll() {
        if (disposed) return;
        if (pending && Date.now() - pending.started > 8000) {
            pending = null;
            status = null;
            message('escDirectionUncertain');
        }
        refresh();
        if (requesting) return;
        requesting = true;
        const operation = pending;
        MSP.promise(MSPCodes.MSP2_INAV_ESC_DIRECTION).then(resp => {
            requesting = false;
            if (disposed) return;
            const previous = status;
            status = resp && [6, 7, 10].includes(resp.length) ? FC.ESC_DIRECTION : null;
            updatedAt = Date.now();
            if (!status?.count) { refresh(); return; }
            $('#esc-direction-simulation').prop('hidden', !status.simulated);
            if (previous?.count !== status.count) drawMotors();
            if (pending && pending === operation) {
                const matches = status.token === pending.payload[2] && status.motor === pending.payload[0]
                    && status.reverse === pending.payload[1];
                if (matches && status.phase === 6) {
                    known[status.motor] = status.reverse;
                    pending = null;
                    message(status.simulated ? 'escWizardSimSaved' : 'escWizardSaved');
                } else if (pending.writeReturned && (!matches || status.phase === 0) && Date.now() - pending.started > 2000) {
                    pending = null;
                    message('escDirectionRefused');
                }
            }
            if (previous?.testActive && !status.testActive && !pending) message('escWizardStopped');
            refresh();
        }).catch(() => {
            requesting = false;
            status = null;
            if (!disposed) { message('escDirectionUncertain'); refresh(); }
        });
    }
    function apply(reverse) {
        if (!permitted()) return;
        const operation = { payload: escDirectionPayload(status, selected, reverse), started: Date.now(), writeReturned: false };
        pending = operation;
        checked[selected] = false;
        known[selected] = undefined;
        message('escDirectionBusy');
        refresh();
        MSP.promise(MSPCodes.MSP2_INAV_SET_ESC_DIRECTION, operation.payload).then(() => {
            if (disposed || pending !== operation) return;
            operation.writeReturned = true;
            poll();
        }).catch(() => {
            if (disposed || pending !== operation) return;
            pending = null;
            status = null;
            message('escDirectionUncertain');
            refresh();
        });
    }
    function sendStop() {
        stopping = true;
        return MSP.promise(MSPCodes.MSP2_INAV_SET_ESC_DIRECTION_TEST, [255, 0, 0]).catch(() => {
            if (!disposed) message('escDirectionUncertain');
        }).finally(() => { stopping = false; if (!disposed) { refresh(); poll(); } });
    }
    function stop() {
        if (!held && !starting && !status?.testActive) return;
        held = false;
        sendStop();
        refresh();
    }
    function start() {
        if (!dialog.open || !mode || !permitted() || !status.supportsTest) return;
        held = true;
        starting = true;
        lastTestToken = (Math.max(lastTestToken, status.testToken) % 255) + 1;
        message('escWizardRunning');
        refresh();
        MSP.promise(MSPCodes.MSP2_INAV_SET_ESC_DIRECTION_TEST, [selected, 1, lastTestToken]).then(() => {
            starting = false;
            // Release/close may happen while the start is still queued. Stop
            // again after its acknowledgement, not just before it is delivered.
            if (!held || disposed || !dialog.open) return sendStop();
            poll();
        }).catch(() => {
            starting = false;
            held = false;
            sendStop();
            if (!disposed) message('escDirectionUncertain');
        });
    }
    function close() {
        stop();
        dialog.close();
    }
    function enter(nextMode) {
        if (!permitted()) return;
        mode = nextMode;
        selected = 0;
        $('#esc-wizard-intro').prop('hidden', true);
        $('#esc-direction-controls').prop('hidden', false);
        drawMotors();
        refresh();
        if (mode === 'wizard') apply(0);
    }
    $('#esc-direction-open').on('click.escDirection', () => {
        mode = null;
        $('#esc-direction-ack').prop('checked', false);
        $('#esc-wizard-intro').prop('hidden', false);
        $('#esc-direction-controls').prop('hidden', true);
        $('#esc-direction-status').empty();
        refresh();
        dialog.showModal();
    });
    $('#esc-mode-wizard').on('click.escDirection', () => enter('wizard'));
    $('#esc-mode-individual').on('click.escDirection', () => enter('individual'));
    $('#esc-direction-normal').on('click.escDirection', () => apply(0));
    $('#esc-direction-reverse').on('click.escDirection', () => apply(1));
    $('#esc-direction-toggle').on('click.escDirection', () => { if (known[selected] !== undefined) apply(1 - known[selected]); });
    $('#esc-wizard-next').on('click.escDirection', () => {
        if (!permitted() || known[selected] === undefined) return;
        checked[selected] = true;
        if (selected === status.count - 1) { message('escWizardComplete'); mode = 'individual'; refresh(); return; }
        selected++;
        refresh();
        apply(0);
    });
    $('#esc-direction-test').on('pointerdown.escDirection', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        start();
    }).on('pointerup.escDirection pointercancel.escDirection pointerleave.escDirection', stop)
        .on('keydown.escDirection', event => {
            if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) start(); }
        }).on('keyup.escDirection', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); stop(); } })
        .on('blur.escDirection', stop);
    $(window).on('pointerup.escDirection blur.escDirection', stop);
    $(document).on('visibilitychange.escDirection', () => { if (document.hidden) stop(); });
    $('#esc-direction-close, #esc-wizard-done').on('click.escDirection', close);
    $(dialog).on('cancel.escDirection', event => { event.preventDefault(); close(); });
    $('#esc-direction-ack, #motorsEnableTestMode').on('change.escDirection', refresh);
    interval.add('esc_direction_poll', poll, 300, true);
    return () => {
        stop();
        disposed = true;
        if (dialog.open) dialog.close();
        interval.remove('esc_direction_poll');
        $('#esc-direction-panel * , #motorsEnableTestMode').off('.escDirection');
        $(window).off('.escDirection');
        $(document).off('.escDirection');
    };
}
