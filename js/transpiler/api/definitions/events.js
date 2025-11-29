/**
 * INAV Event Handlers API Definition
 * 
 * Location: js/transpiler/api/definitions/events.js
 * 
 * Event handler functions for triggering logic.
 * These define when and how logic conditions execute.
 * 
 * NOTE: For simple conditional logic, use standard JavaScript if/else statements.
 * The functions defined here provide specialized timing and state management
 * functionality beyond what if statements can provide.
 */

'use strict';

export default {
  // on namespace - time-based and state-based triggers
  on: {
    type: 'namespace',
    desc: 'Event-based trigger handlers',
    methods: {
      arm: {
        type: 'function',
        desc: 'Execute once after arming with optional delay',
        params: {
          config: {
            type: 'object',
            properties: {
              delay: {
                type: 'number',
                unit: 's',
                desc: 'Delay in seconds after arming (default: 0)',
                default: 0,
                range: [0, 60]
              }
            }
          },
          callback: {
            type: 'function',
            desc: 'Function to execute'
          }
        },
        example: 'on.arm({ delay: 1 }, () => { gvar[0] = 100; })'
      },
      
      always: {
        type: 'function',
        desc: 'Execute continuously every cycle',
        params: {
          callback: {
            type: 'function',
            desc: 'Function to execute'
          }
        },
        example: 'on.always(() => { gvar[0] = flight.altitude; })'
      }
    }
  },
  
  // Advanced timing and state management functions
  // For simple conditions, use if statements instead
  
  sticky: {
    type: 'function',
    desc: 'Execute when on-condition is true, stop when off-condition is true (maintains state)',
    note: 'For simple conditions without state tracking, use if/else statements instead',
    params: {
      onCondition: {
        type: 'function',
        desc: 'Condition to start execution',
        returns: 'boolean'
      },
      offCondition: {
        type: 'function',
        desc: 'Condition to stop execution',
        returns: 'boolean'
      },
      action: {
        type: 'function',
        desc: 'Action function to execute while active'
      }
    },
    inavOperation: 13, // OPERATION.STICKY
    example: 'sticky(() => flight.rssi < 20, () => flight.rssi > 50, () => { override.vtx.power = 4; })'
  },
  
  edge: {
    type: 'function',
    desc: 'Execute only when condition transitions from false to true (rising edge detection)',
    note: 'For simple conditions without edge detection, use if statements instead',
    params: {
      condition: {
        type: 'function',
        desc: 'Condition to watch for rising edge',
        returns: 'boolean'
      },
      config: {
        type: 'object',
        properties: {
          duration: {
            type: 'number',
            unit: 'ms',
            desc: 'Minimum duration condition must be true (debounce)',
            default: 0
          }
        }
      },
      action: {
        type: 'function',
        desc: 'Action to execute on rising edge'
      }
    },
    example: 'edge(() => rc[5].high, { duration: 100 }, () => { gvar[0] = gvar[0] + 1; })'
  },
  
  delay: {
    type: 'function',
    desc: 'Execute action after condition has been true for specified duration',
    note: 'For immediate execution, use if statements instead',
    params: {
      condition: {
        type: 'function',
        desc: 'Condition to monitor',
        returns: 'boolean'
      },
      delayMs: {
        type: 'number',
        unit: 'ms',
        desc: 'Delay duration in milliseconds'
      },
      action: {
        type: 'function',
        desc: 'Action to execute after delay'
      }
    },
    example: 'delay(() => flight.rssi < 10, 5000, () => { rc[8] = 2000; })'
  },
  
  timer: {
    type: 'function',
    desc: 'Execute action on a periodic timer (on/off cycling)',
    params: {
      onMs: {
        type: 'number',
        unit: 'ms',
        desc: 'Duration to run action'
      },
      offMs: {
        type: 'number',
        unit: 'ms',
        desc: 'Duration to wait between executions'
      },
      action: {
        type: 'function',
        desc: 'Action to execute during on-time'
      }
    },
    example: 'timer(1000, 5000, () => { override.vtx.power = 4; })'
  },
  
  whenChanged: {
    type: 'function',
    desc: 'Execute when value changes by more than threshold',
    params: {
      value: {
        type: 'number',
        desc: 'Value to monitor'
      },
      threshold: {
        type: 'number',
        desc: 'Change threshold'
      },
      action: {
        type: 'function',
        desc: 'Action to execute on change'
      }
    },
    example: 'whenChanged(flight.altitude, 100, () => { gvar[0] = flight.altitude; })'
  }
};
