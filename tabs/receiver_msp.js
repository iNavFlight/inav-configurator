"use strict";

window.$ = window.jQuery = require('jquery');

var
    CHANNEL_MIN_VALUE = 1000,
    CHANNEL_MID_VALUE = 1500,
    CHANNEL_MAX_VALUE = 2000,
    
    // What's the index of each channel in the MSP channel list?
    channelMSPIndexes = {
        Roll: 0,
        Pitch: 1,
        Yaw: 3,
        Throttle: 2,
        ch5: 4,
        ch6: 5,
        ch7: 6,
        ch8: 7,
        ch9: 8,
        ch10: 9,
        ch11: 10,
        ch12: 11,
    },
    
    // Set reasonable initial stick positions (Mode 2)
    stickValues = {
        Throttle: CHANNEL_MIN_VALUE,
        Pitch: CHANNEL_MID_VALUE,
        Roll: CHANNEL_MID_VALUE,
        Yaw: CHANNEL_MID_VALUE,
        ch5: CHANNEL_MIN_VALUE,
        ch6: CHANNEL_MIN_VALUE,
        ch7: CHANNEL_MIN_VALUE,
        ch8: CHANNEL_MIN_VALUE,
        ch9: CHANNEL_MIN_VALUE,
        ch10: CHANNEL_MIN_VALUE,
        ch11: CHANNEL_MIN_VALUE,
        ch12: CHANNEL_MIN_VALUE,
    },
    
    // First the vertical axis, then the horizontal:
    gimbals = [
        ["Throttle", "Yaw"],
        ["Pitch", "Roll"]
    ],
    
    gimbalElems,
    sliderElems,
    
    enableTX = false;

function transmitChannels() {
    var 
        channelValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (!enableTX) {
        return;
    }
    
    for (var stickName in stickValues) {
        channelValues[channelMSPIndexes[stickName]] = stickValues[stickName];
    }
    
    // Callback given to us by the window creator so we can have it send data over MSP for us:
    if (!window.setRawRx(channelValues)) {
        // MSP connection has gone away
        window.current().close();
    }
}

function stickPortionToChannelValue(portion) {
    portion = Math.min(Math.max(portion, 0.0), 1.0);
    
    return Math.round(portion * (CHANNEL_MAX_VALUE - CHANNEL_MIN_VALUE) + CHANNEL_MIN_VALUE);
}

function channelValueToStickPortion(channel) {
    return (channel - CHANNEL_MIN_VALUE) / (CHANNEL_MAX_VALUE - CHANNEL_MIN_VALUE);
}

function updateControlPositions() {
    for (var stickName in stickValues) {
        var
            stickValue = stickValues[stickName];
        
        // Look for the gimbal which corresponds to this stick name
        for (var gimbalIndex in gimbals) {
            var 
                gimbal = gimbals[gimbalIndex],
                gimbalElem = gimbalElems.get(gimbalIndex),
                gimbalSize = $(gimbalElem).width(),
                stickElem = $(".control-stick", gimbalElem);
            
            if (gimbal[0] == stickName) {
                stickElem.css('top', (1.0 - channelValueToStickPortion(stickValue)) * gimbalSize + "px");
                break;
            } else if (gimbal[1] == stickName) {
                stickElem.css('left', channelValueToStickPortion(stickValue) * gimbalSize + "px");
                break;
            }
        }
    }
}

function handleGimbalMouseDrag(e) {
    var 
        gimbal = $(gimbalElems.get(e.data.gimbalIndex)),
        gimbalOffset = gimbal.offset(),
        gimbalSize = gimbal.width();
    
    stickValues[gimbals[e.data.gimbalIndex][0]] = stickPortionToChannelValue(1.0 - (e.pageY - gimbalOffset.top) / gimbalSize);
    stickValues[gimbals[e.data.gimbalIndex][1]] = stickPortionToChannelValue((e.pageX - gimbalOffset.left) / gimbalSize);
    
    updateControlPositions();
}

function localizeAxisNames() {
    for (var gimbalIndex in gimbals) {
        var 
            gimbal = gimbalElems.get(gimbalIndex);
        
        $(".gimbal-label-vert", gimbal).text(gimbals[gimbalIndex][0]);
        $(".gimbal-label-horz", gimbal).text(gimbals[gimbalIndex][1]);
    }
    
    for (var sliderIndex = 0; sliderIndex < 8; sliderIndex++) {
       $(".slider-label", sliderElems.get(sliderIndex)).text("CH " + (sliderIndex + 5));
    }
}

$(function() {
    $("a.button-enable").on('click', function () {
        
       
        var shrinkHeight = $(".warning").height();
        
        $(".warning").slideUp("short", function() {
            window.current().innerBounds.minHeight -= shrinkHeight;
            window.current().innerBounds.height -= shrinkHeight;
            window.current().innerBounds.maxHeight -= shrinkHeight;
        });
        
        
        enableTX = true;
    });
    
    gimbalElems = $(".control-gimbal");
    sliderElems = $(".control-slider");
    
    gimbalElems.each(function(gimbalIndex) {
        $(this).on('mousedown', {gimbalIndex: gimbalIndex}, function(e) {
            if (e.which == 1) { // Only move sticks on left mouse button
                handleGimbalMouseDrag(e);
                
                $(window).on('mousemove', {gimbalIndex: gimbalIndex}, handleGimbalMouseDrag);
            }
        });
    });
    
    $(".slider", sliderElems).each(function(sliderIndex) {
        var 
            initialValue = stickValues["ch" + (sliderIndex + 5)];
        
        $(this)
            .noUiSlider({
                start: initialValue,
                range: {
                    min: CHANNEL_MIN_VALUE,
                    max: CHANNEL_MAX_VALUE
                }
            }).on('slide change set', function(e, value) {
                value = Math.round(parseFloat(value));
                
                stickValues["ch" + (sliderIndex + 5)] = value;
                
                $(".tooltip", this).text(value);
            });
        
        $(this).append('<div class="tooltip"></div>');
        
        $(".tooltip", this).text(initialValue);
    });
    
    /* 
     * Mouseup handler needs to be bound to the window in order to receive mouseup if mouse leaves window.
     */
    $(window).mouseup(function(e) {
        $(this).off('mousemove', handleGimbalMouseDrag);
    });
    
    localizeAxisNames();
    
    updateControlPositions();
    
    setInterval(transmitChannels, 50);
});
