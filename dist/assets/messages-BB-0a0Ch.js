const n=`{\r
    "translation_version": {\r
        "message": "0"\r
    },\r
    "language_de": {\r
        "message": "Deutsch",\r
        "comment": "Don't translate!"\r
    },\r
    "language_en": {\r
        "message": "English",\r
        "_comment": "Don't translate!"\r
    },\r
    "language_uk": {\r
        "message": "українська",\r
        "_comment": "Don't translate!"\r
    },\r
    "language_zh_CN": {\r
        "message": "简体中文",\r
        "_comment": "Don't translate!"\r
    },\r
    "language": {\r
        "message": "语言"\r
    },\r
    "options_title": {\r
        "message": "应用程序选项"\r
    },\r
    "options_receive_app_notifications": {\r
        "message": "程序更新时接收桌面<strong>通知</strong>"\r
    },\r
    "options_improve_configurator": {\r
        "message": "匿名发送使用情况给开发团队"\r
    },\r
    "options_showProfileParameters": {\r
        "message": "切换电池或控制配置文件时突出显示更改的参数"\r
    },\r
    "options_cliAutocomplete": {\r
        "message": "高级命令行自动补全"\r
    },\r
    "options_unit_type": {\r
        "message": "设置仅在配置程序上生效的长度单位"\r
    },\r
    "options_render": {\r
        "message": "配置器渲染选项"\r
    },\r
    "unexpectedError" : {\r
        "message": "意外错误: $1"\r
    },\r
    "disconnecting": {\r
        "message": "正在断开连接..."\r
    },\r
    "connect": {\r
        "message": "连接"\r
    },\r
    "connecting": {\r
        "message": "连接中"\r
    },\r
    "disconnect": {\r
        "message": "断开连接"\r
    },\r
    "autoConnect": {\r
        "message": "自动连接"\r
    },\r
    "autoConnectEnabled": {\r
        "message": "自动连接: 已开启 - 地面站会自动连接新插入的串口"\r
    },\r
    "autoConnectDisabled": {\r
        "message": "自动连接: 已禁用 - 你需要自己选择串口，然后单击\\"连接\\"按钮"\r
    },\r
    "deviceRebooting": {\r
        "message": "设备 - <span style=\\"color: red\\">重启中</span>"\r
    },\r
    "deviceReady": {\r
        "message": "设备 - <span style=\\"color: #37a8db\\">已就绪</span>"\r
    },\r
    "savingDefaults": {\r
        "message": "设备 - <span style=\\"color: red\\">保存默认设置</span>"\r
    },\r
    "fcNotConnected": {\r
        "message": "无连接"\r
    },\r
\r
    "backupFileIncompatible": {\r
        "message": "您提供的备份文件为旧版本的配置器所生成，与当前版本的配置器不兼容。"\r
    },\r
\r
    "backupFileUnmigratable": {\r
        "message": "您所提供的备份文件是由旧版本的配置器生成的，无法迁移。"\r
    },\r
\r
    "configMigrationFrom": {\r
        "message": "迁移配置器生成的配置文件: $1"\r
    },\r
    "configMigratedTo": {\r
        "message": "将配置迁移到配置器: $1"\r
    },\r
    "configMigrationSuccessful": {\r
        "message": "配置迁移完成，迁移应用: $1"\r
    },\r
    "documentation": {\r
        "message": "文档"\r
    },\r
    "tabFirmwareFlasher": {\r
        "message": "更新固件"\r
    },\r
    "tabLanding": {\r
        "message": "欢迎"\r
    },\r
    "tabHelp": {\r
        "message": "文档 & 支援"\r
    },\r
    "tabSetup": {\r
        "message": "设置"\r
    },\r
    "tabCalibration": {\r
        "message": "校准"\r
    },\r
    "tabConfiguration": {\r
        "message": "配置"\r
    },\r
    "tabPorts": {\r
        "message": "端口"\r
    },\r
    "tabPidTuning": {\r
        "message": "PID 调整"\r
    },\r
    "tabReceiver": {\r
        "message": "接收机"\r
    },\r
    "tabMisc": {\r
        "message": "杂项"\r
    },\r
    "tabModeSelection": {\r
        "message": "模式选择"\r
    },\r
    "tabServos": {\r
        "message": "舵机"\r
    },\r
    "tabFailsafe": {\r
        "message": "失控保护"\r
    },\r
    "tabEzTune": {\r
        "message": "Ez Tune"\r
    },\r
    "tabGPS": {\r
        "message": "GPS"\r
    },\r
    "tabOutputs": {\r
        "message": "输出"\r
    },\r
    "tabLedStrip": {\r
        "message": "LED 灯带"\r
    },\r
    "tabRawSensorData": {\r
        "message": "传感器"\r
    },\r
    "tabCLI": {\r
        "message": "CLI(命令行)"\r
    },\r
    "tabLogging": {\r
        "message": "日志"\r
    },\r
    "tabOnboardLogging": {\r
        "message": "黑匣子"\r
    },\r
    "tabAdjustments": {\r
        "message": "调整"\r
    },\r
    "tabAuxiliary": {\r
        "message": "模式"\r
    },\r
    "tabSitl": {\r
        "message": "SITL"\r
    },\r
    "sitlDemoMode": {\r
        "message": "演示模式"\r
    },\r
    "sitlResetDemoModeData": {\r
        "message": "重置演示模式"\r
    },\r
    "sitlOSNotSupported": {\r
        "message": "这个操作系统不支持SITL。"\r
    },\r
    "sitlOptions": {\r
        "message": "SITL选项"\r
    },\r
    "sitlEnableSim": {\r
        "message": "启用模拟器"\r
    },\r
    "sitlSimulator": {\r
        "message": "模拟器"\r
    },\r
    "sitlUseImu": {\r
        "message": "使用IMU"\r
    },\r
    "sitlSimIP": {\r
        "message": "模拟器IP"\r
    },\r
    "sitlPort": {\r
        "message": "模拟器端口"\r
    },\r
    "sitlChannelMap": {\r
        "message": "通道映射"\r
    },\r
    "sitlSimInput": {\r
        "message": "模拟器输入"\r
    },\r
    "sitlInavOutput": {\r
        "message": "INAV输出"\r
    },\r
    "sitlLog": {\r
        "message": "日志"\r
    },\r
    "sitlStart": {\r
        "message": "开始"\r
    },\r
    "sitlStop": {\r
        "message": "停止"\r
    },\r
    "sitlStopped": {\r
        "message": "SITL停止\\n"\r
    },\r
    "sitlProfiles": {\r
        "message": "SITL概要文件"\r
    },\r
    "sitlNew": {\r
        "message": "New"\r
    },\r
    "sitlSave": {\r
        "message": "保存"\r
    },\r
    "sitlDelete": {\r
        "message": "删除"\r
    },\r
    "sitlNewProfile": {\r
        "message": "新的SITL配置文件"\r
    },\r
    "sitlEnterName": {\r
        "message": "(配置文件名称)"\r
    },\r
    "sitlProfileExists": {\r
        "message": "具有此名称的配置文件已经存在。"\r
    },\r
    "sitlStdProfileCantDeleted": {\r
        "message": "不能删除SITL标准配置文件。"\r
    },\r
    "sitlStdProfileCantOverwritten": {\r
        "message": "SITL标准配置文件不能被覆盖。请创建一个新的。"\r
    },\r
    "serialReceiver": {\r
        "message": "串行接收器"\r
    },\r
    "sitlSerialProtocoll": {\r
        "message": "预设RX协议"\r
    },\r
    "sitlSerialStopbits": {\r
        "message": "停止位"\r
    },\r
    "sitlSerialPort": {\r
        "message": "串口"\r
    },\r
    "sitlSerialUART": {\r
        "message": "串行接收器已配置在 SITL 的 UART 上"\r
    },\r
    "sitlSerialParity": {\r
        "message": "奇偶校验位"\r
    },\r
    "sitlSerialTcpEnable": {\r
        "message": "启用"\r
    },\r
    "sitlHelp": {\r
        "message": "软件在环仿真SITL (Software in the loop)允许在不使用飞行控制器的情况下在PC上完全用软件运行INAV，并模拟完整的FPV飞行。为此，INAV使用普通的PC编译器进行编译。传感器由模拟器提供的数据代替。<br/>目前支持的有:<br/><ul><li><a href=\\"https://www.realflight.com\\" target=\\"_blank\\">RealFlight</a><br/></li><li><a href=\\"https://www.x-plane.com\\" target=\\"_blank\\">X-Plane</a></li></ul>"\r
    },\r
    "sitlProfilesHelp": {\r
        "message": "配置文件保存在本地。描述文件不仅包含该选项卡的所有数据，还包含INAV本身的配置文件(\\"EEPROM\\")。<br><span style=\\"color: red\\">注意:</span><br>标准配置文件不能覆盖。要保存更改，请创建一个新的配置文件。"\r
    },\r
    "sitlEnableSimulatorHelp": {\r
        "message": "如果此选项被禁用，则只能使用UARTS (MSP/Configurator)。可以在不启动模拟器的情况下配置INAV。"\r
    },\r
    "sitlUseImuHelp": {\r
        "message": "使用模拟器的IMU传感器数据，而不是直接使用模拟器的姿态数据(实验数据，不推荐)。"\r
    },\r
    "sitlIpHelp": {\r
        "message": "运行模拟器的计算机的IP地址。如果模拟器在同一台计算机上运行，请将其设置为\\"127.0.0.1"\r
    },\r
    "sitlPortHelp": {\r
        "message": "模拟器的接口端口号。注意:RealFlight端口已固定，不能更改。"\r
    },\r
    "sitlSerialReceiverHelp": {\r
        "message": "使用通过 USB 转 UART 适配器或代理飞控连接到主机的接收器（SBUS/CRSF 等）。"\r
    },\r
    "auxiliaryAcroEnabled": {\r
        "message": "手动模式"\r
    },\r
    "serialPortOpened": {\r
        "message": "打开串口 <span style=\\"color: #37a8db\\">成功</span> ID: $1"\r
    },\r
    "serialPortOpenFail": {\r
        "message": "打开串口 <span class=\\"message-negative\\">失败</span>"\r
    },\r
    "serialPortClosedOk": {\r
        "message": "关闭串口 <span class=\\"message-positive\\">成功</span>"\r
    },\r
    "serialPortClosedFail": {\r
        "message": "关闭串口 <span class=\\"message-negative\\">失败</span>"\r
    },\r
    "serialPortUnrecoverable": {\r
        "message": "不可恢复的串行连接 <span style=\\"color: red\\">失败</span> , 断开连接中...'"\r
    },\r
    "connectionConnected": {\r
        "message": "连接到 : $1"\r
    },\r
    "connectionBleType": {\r
        "message": "蓝牙设备类型 : $1"\r
    },\r
    "connectionBleNotSupported": {\r
        "message": "<span style=\\"color: red\\">连接错误:</span> 固件不支持蓝牙连接。中止。"\r
    },\r
    "connectionBleInterrupted": {\r
        "message": "连接意外中断。"\r
    },\r
    "connectionBleError": {\r
        "message": "打开蓝牙设备时出错: $1"\r
    },\r
    "connectionBleCliEnter": {\r
        "message": "正在通过蓝牙连接地面站，传输速度可能比正常慢。"\r
    },\r
    "connectionUdpTimeout": {\r
        "message": "UDP连接超时。"\r
    },\r
    "usbDeviceOpened": {\r
        "message": "打开 USB 设备 <span class=\\"message-positive\\">成功</span> ID: $1"\r
    },\r
    "usbDeviceOpenFail": {\r
        "message": "打开 USB 设备 <span class=\\"message-negative\\">失败</span>！"\r
    },\r
    "usbDeviceClosed": {\r
        "message": "关闭 USB 设备 <span class=\\"message-positive\\">成功</span>"\r
    },\r
    "usbDeviceCloseFail": {\r
        "message": "关闭 USB 设备 <span class=\\"message-negative\\">失败</span>"\r
    },\r
    "usbDeviceUdevNotice": {\r
        "message": "检查<strong>udev 规则</strong>是否正确安装? 详细信息请查阅文档。"\r
    },\r
    "stm32UsbDfuNotFound": {\r
        "message": "未找到 USB DFU"\r
    },\r
    "stm32RebootingToBootloader": {\r
        "message": "重新启动并进入 bootloader ..."\r
    },\r
    "stm32RebootingToBootloaderFailed": {\r
        "message": "重启设备并进入 bootloader：失败"\r
    },\r
    "stm32TimedOut": {\r
        "message": "STM32 - 超时，烧录失败"\r
    },\r
    "stm32WrongResponse": {\r
        "message": "STM32 通信失败，错误的响应。应为：$1 (0x$2) 实际收到: $3 (0x$4)"\r
    },\r
    "stm32ContactingBootloader": {\r
        "message": "尝试连接引导程序"\r
    },\r
    "stm32ContactingBootloaderFailed": {\r
        "message": "引导程序通信失败"\r
    },\r
    "stm32ResponseBootloaderFailed": {\r
        "message": "引导程序无响应，烧录失败"\r
    },\r
    "stm32GlobalEraseExtended": {\r
        "message": "正在执行全局芯片擦除（通过扩展擦除）…"\r
    },\r
    "stm32LocalEraseExtended": {\r
        "message": "正在执行本地擦除（通过扩展擦除）…"\r
    },\r
    "stm32GlobalErase": {\r
        "message": "正在执行全局擦除…"\r
    },\r
    "stm32LocalErase": {\r
        "message": "正在执行本地擦除…"\r
    },\r
    "stm32InvalidHex": {\r
        "message": "无效固件"\r
    },\r
    "stm32Erase": {\r
        "message": "擦除中…"\r
    },\r
    "stm32Flashing": {\r
        "message": "烧录中…"\r
    },\r
    "stm32Verifying": {\r
        "message": "验证中…"\r
    },\r
    "stm32ProgrammingSuccessful": {\r
        "message": "烧录成功"\r
    },\r
    "stm32ProgrammingFailed": {\r
        "message": "烧录失败"\r
    },\r
    "stm32AddressLoadFailed": {\r
        "message": "定位选项字节扇区失败。很可能是因为读取保护造成的。"\r
    },\r
    "stm32AddressLoadSuccess": {\r
        "message": "定位选项字节扇区成功。"\r
    },\r
    "stm32AddressLoadUnknown": {\r
        "message": "因未知错误，定位选项字节扇区失败。正在中止。"\r
    },\r
    "stm32NotReadProtected": {\r
        "message": "读取保护未启用"\r
    },\r
    "stm32ReadProtected": {\r
        "message": "飞控板似乎有读取保护。正在解除保护。不要断开连接/拔出插头！"\r
    },\r
    "stm32UnprotectSuccessful": {\r
        "message": "解除保护成功。"\r
    },\r
    "stm32UnprotectUnplug": {\r
        "message": "请拔出飞控并且以 DFU 模式重新连接飞控后重新尝试烧录！"\r
    },\r
    "stm32UnprotectFailed": {\r
        "message": "解除保护失败"\r
    },\r
    "stm32UnprotectInitFailed": {\r
        "message": "解除保护程序初始化失败"\r
    },\r
\r
    "noConfigurationReceived": {\r
        "message": "<span style=\\"color: red\\">10秒</span>内没有接收到配置信息, 飞控通信 <span style=\\"color: red\\">失败</span>"\r
    },\r
    "firmwareVersionNotSupported": {\r
        "message": "<span style=\\"color: red\\">不支持</span>此版本的固件， 本配置器支持从 $1 到 $2 (不包括)的固件"\r
    },\r
    "firmwareVariantNotSupported": {\r
        "message": "非INAV固件，配置器<span style=\\"color: red\\">不支持</span>， 请升级为INAV固件. 升级前请使用CLI备份参数.  CLI备份/恢复过程在文档中可以查看到."\r
    },\r
\r
    "tabSwitchConnectionRequired": {\r
        "message": "在查看任何页面信息之前，你需要先<strong>连接</strong>"\r
    },\r
    "tabSwitchWaitForOperation": {\r
        "message": "<span style=\\"color: red\\">无法</span>执行当前操作,请等待上一个操作完成…"\r
    },\r
\r
    "tabSwitchUpgradeRequired": {\r
        "message": "需要<strong>升级</strong>最新的版本，才能使用 $1 页面."\r
    },\r
    "firmwareVersion": {\r
        "message": "固件版本: <strong>$1</strong>"\r
    },\r
    "apiVersionReceived": {\r
        "message": "MultiWii API 版本 <span style=\\"color: #37a8db\\">接收</span> - <strong>$1</strong>"\r
    },\r
    "uniqueDeviceIdReceived": {\r
        "message": "唯一设备 ID <span style=\\"color: #37a8db\\">接收</span> - <strong>0x$1</strong>"\r
    },\r
    "boardInfoReceived": {\r
        "message": "飞控: <strong>$1</strong>, 版本: <strong>$2</strong>"\r
    },\r
    "buildInfoReceived": {\r
        "message": "当前固件发布时间： <strong>$1</strong>"\r
    },\r
    "fcInfoReceived": {\r
        "message": "飞控信息，识别名：<strong>$1</strong>，版本：<strong>$2</strong>"\r
    },\r
\r
    "notifications_app_just_updated_to_version": {\r
        "message": "程序已经更新到版本: $1"\r
    },\r
    "notifications_click_here_to_start_app": {\r
        "message": "单击这里运行程序"\r
    },\r
\r
    "statusbar_port_utilization": {\r
        "message": "端口利用率："\r
    },\r
    "statusbar_usage_download": {\r
        "message": "下行: $1%"\r
    },\r
    "statusbar_usage_upload": {\r
        "message": "上行: $1%"\r
    },\r
    "statusbar_packet_error": {\r
        "message": "数据包错误:"\r
    },\r
    "statusbar_i2c_error": {\r
        "message": "I2C 错误:"\r
    },\r
    "statusbar_cycle_time": {\r
        "message": "循环时间:"\r
    },\r
    "statusbar_cpu_load": {\r
        "message": "CPU 负载: $1%"\r
    },\r
    "statusbar_arming_flags": {\r
        "message": "解锁标志:"\r
    },\r
\r
    "dfu_connect_message": {\r
        "message": "请使用固件烧录器来访问 DFU 设备"\r
    },\r
    "dfu_erased_kilobytes": {\r
        "message": "擦除 $1 kB 闪存 <span style=\\"color: #37a8db\\">成功</span>"\r
    },\r
    "dfu_device_flash_info": {\r
        "message": "检测到闪存空间为 $1 KiB 的芯片"\r
    },\r
    "dfu_error_image_size": {\r
        "message": "<span style=\\"color: red; font-weight: bold\\">错误</span>：固件文件大于飞控芯片的闪存。固件大小: $1 KiB，上限 = $2 KiB"\r
    },\r
\r
    "eeprom_saved_ok": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
\r
    "defaultWelcomeIntro": {\r
        "message": "欢迎使用 <strong>INAV - 配置程序</strong>，为简化固件升级，设置和调校飞控而生的工具。"\r
    },\r
    "defaultWelcomeHead": {\r
        "message": "硬件"\r
    },\r
    "defaultWelcomeHead2": {\r
        "message": "INAV 赞助者"\r
    },\r
    "defaultWelcomeText2": {\r
        "message": "INAV由大量用户、开发人员和公司组成的社区支持。下面是一个简短的列表: <a href=\\"http://www.mateksys.com/\\" target=\\"_blank\\">Mateksys</a>, <a href=\\"https://www.speedybee.com/\\" target=\\"_blank\\">SpeedyBee</a>, <a href=\\"https://geprc.com/\\" target=\\"_blank\\">GEPRC</a>. "\r
    },\r
    "defaultWelcomeText": {\r
        "message": "本应用支持所有能运行 INAV 的飞控。(<a href=\\"https://inavflight.com/shop/s/bg/1890404\\" target=\\"_blank\\">Matek F765-WSE</a>, <a href=\\"https://inavflight.com/shop/s/bg/1755036\\" target=\\"_blank\\">Matek H743-SLIM</a> 及其他硬件)。可用的硬件完整列表在 <a href=\\"https://github.com/iNavFlight/inav/wiki/Welcome-to-INAV,-useful-links-and-products\\" target=\\"_blank\\">这里</a>.<br /><br />固件的源代码可以从 <a href=\\"https://github.com/iNavFlight\\" title=\\"www.github.com\\" target=\\"_blank\\">这里</a>下载<br />最新的飞控固件在 <a href=\\"https://github.com/iNavFlight/inav/releases\\" title=\\"www.github.com\\" target=\\"_blank\\">这里</a>下载.<br /><br />最新的 <strong>STM USB VCP 驱动</strong> 可以点击 <a href=\\"http://www.st.com/web/en/catalog/tools/PF257938\\" title=\\"http://www.st.com\\" target=\\"_blank\\">这里</a>下载<br />最新的 <strong>Zadig</strong> Windows DFU USB驱动安装程序可以点击 <a href=\\"http://zadig.akeo.ie/\\" title=\\"http://zadig.akeo.ie\\" target=\\"_blank\\">这里</a>下载<br />"\r
    },\r
    "defaultContributingHead": {\r
        "message": "参与开发"\r
    },\r
    "defaultContributingText": {\r
        "message": "如果您希望帮助让 INAV 变得更好，您可以通过以下方式贡献力量：<br /><ul><li>在论坛和 IRC 上回答其他用户的问题。</li><li>为固件和配置器贡献代码——新增功能、修复问题、改进性能。</li><li>测试<a href=\\"https://github.com/iNavFlight/inav/pulls\\" target=\\"_blank\\">新功能/修复</a>并提供反馈。</li><li>协助处理<a href=\\"https://github.com/iNavFlight/inav/issues\\" target=\\"_blank\\">问题并评论功能请求</a>。</li></ul>"\r
    },\r
    "defaultChangelogHead": {\r
        "message": "配置程序 - 更新日志"\r
    },\r
    "defaultButtonFirmwareFlasher": {\r
        "message": "固件烧录器"\r
    },\r
    "defaultDonateHead": {\r
        "message": "开源/捐赠说明"\r
    },\r
    "defaultDonateText": {\r
        "message": "<strong>INAV</strong>是一个<strong>开放源码</strong>的飞行控制软件，并免费提供给所有<strong>INAV</strong>用户使用。<br />如果你发现INAV或INAV配置器对你有用，请考虑捐赠以<strong>支持</strong>它的开发工作。"\r
    },\r
    "defaultSponsorsHead": {\r
        "message": "支持"\r
    },\r
    "communityRCGroupsSupport": {\r
        "message": "RC Groups 论坛"\r
    },\r
    "communityDiscordServer": {\r
        "message": "Discord 社区服务器"\r
    },\r
    "communitySlackSupport": {\r
        "message": "Slack 在线支持"\r
    },\r
    "communityTelegramSupport": {\r
        "message": "Telegram 频道"\r
    },\r
    "communityFacebookSupport": {\r
        "message": "Facebook 组"\r
    },\r
    "initialSetupBackupAndRestoreApiVersion": {\r
        "message": "<span style=\\"color: red\\">备份和恢复功能已禁用.</span>  您的固件API版本 <span style=\\"color: red\\">$1</span>, 备份和恢复需要 <span style=\\"color: #37a8db\\">$2</span>.  请通过CLI备份您的设置, 详情请参阅INAV文档。"\r
    },\r
    "initialSetupButtonCalibrateAccel": {\r
        "message": "校准加速度计"\r
    },\r
    "initialSetupCalibrateAccelText": {\r
        "message": "加速度计的6面校准。进入iNav的wiki，获取传感器校准的更多信息"\r
    },\r
    "initialSetupButtonCalibrateMag": {\r
        "message": "校准罗盘"\r
    },\r
    "initialSetupCalibrateMagText": {\r
        "message": "将飞行器在所有轴向上都移动至少<strong>360</strong>度来校准罗盘，你有30秒的时间可供进行这项操作。"\r
    },\r
    "initialSetupButtonReset": {\r
        "message": "恢复默认设置"\r
    },\r
    "initialSetupResetText": {\r
        "message": "恢复默认设置"\r
    },\r
    "initialSetupButtonBackup": {\r
        "message": "备份"\r
    },\r
    "initialSetupButtonRestore": {\r
        "message": "恢复"\r
    },\r
    "initialSetupBackupRestoreText": {\r
        "message": "<strong>备份</strong>你的设置以防意外丢失, 注意<strong>CLI(命令行)</strong> 设置 <span style=\\"color: red\\">没有</span> 包括在内- 参见 'dump' 命令"\r
    },\r
    "initialSetupBackupSuccess": {\r
        "message": "备份保存 <span style=\\"color: #37a8db\\">成功</span>"\r
    },\r
    "initialSetupRestoreSuccess": {\r
        "message": "配置恢复 <span style=\\"color: #37a8db\\">成功</span>"\r
    },\r
    "initialSetupButtonResetZaxis": {\r
        "message": "重置 Z 轴，补偿：0 度"\r
    },\r
    "initialSetupButtonResetZaxisValue": {\r
        "message": "重置 Z 轴, 补偿: $1 度"\r
    },\r
    "initialSetupMixerHead": {\r
        "message": "混控类型"\r
    },\r
    "initialSetupThrottleHead": {\r
        "message": "油门设置"\r
    },\r
    "initialSetupMinimum": {\r
        "message": "最小值:"\r
    },\r
    "initialSetupMaximum": {\r
        "message": "最大值:"\r
    },\r
    "initialSetupFailsafe": {\r
        "message": "失控保护:"\r
    },\r
    "initialSetupMinCommand": {\r
        "message": "最小油门:"\r
    },\r
    "initialSetupBatteryHead": {\r
        "message": "电池"\r
    },\r
    "initialSetupMinCellV": {\r
        "message": "单芯最低电压:"\r
    },\r
    "initialSetupMaxCellV": {\r
        "message": "单芯最高电压:"\r
    },\r
    "initialSetupVoltageScale": {\r
        "message": "电压计比例:"\r
    },\r
    "initialSetupAccelTrimsHead": {\r
        "message": "加速度计微调"\r
    },\r
    "initialSetupPitch": {\r
        "message": "俯仰:"\r
    },\r
    "initialSetupRoll": {\r
        "message": "横滚:"\r
    },\r
    "initialSetupMagHead": {\r
        "message": "罗盘"\r
    },\r
    "initialSetupDeclination": {\r
        "message": "经纬度:"\r
    },\r
    "initialSetupInfoHead": {\r
        "message": "信息"\r
    },\r
    "initialSetupBatteryVoltage": {\r
        "message": "电池电压："\r
    },\r
    "initialSetupBatteryDetectedCells": {\r
        "message": "电芯数:"\r
    },\r
    "initialSetupBatteryDetectedCellsValue": {\r
        "message": "$1"\r
    },\r
    "initialSetupBatteryPercentage": {\r
        "message": "电量统计:"\r
    },\r
    "initialSetupBatteryPercentageValue": {\r
        "message": "$1 %"\r
    },\r
    "initialSetupBatteryRemainingCapacity": {\r
        "message": "电池剩余容量"\r
    },\r
    "initialSetupBatteryRemainingCapacityValue": {\r
        "message": "$1 $2"\r
    },\r
    "initialSetupBatteryFull": {\r
        "message": "电池充满时插入"\r
    },\r
    "initialSetupBatteryFullValue": {\r
        "message": "$1"\r
    },\r
    "initialSetupBatteryThresholds": {\r
        "message": "电池使用上限阈值"\r
    },\r
    "initialSetupBatteryThresholdsValue": {\r
        "message": "$1"\r
    },\r
    "initialSetup_Wh_drawn": {\r
        "message": "已用容量："\r
    },\r
    "initialSetup_Wh_drawnValue": {\r
        "message": "$1 Wh"\r
    },\r
    "initialSetupBatteryVoltageValue": {\r
        "message": "$1 V"\r
    },\r
    "initialSetupDrawn": {\r
        "message": "已用容量："\r
    },\r
    "initialSetupCurrentDraw": {\r
        "message": "耗费电流："\r
    },\r
    "initialSetupPowerDraw": {\r
        "message": "功率:"\r
    },\r
    "initialSetupPowerDrawValue": {\r
        "message": "$1 W"\r
    },\r
    "initialSetupBatteryMahValue": {\r
        "message": "$1 mAh"\r
    },\r
    "initialSetupCurrentDrawValue": {\r
        "message": "$1 A"\r
    },\r
    "initialSetupRSSI": {\r
        "message": "RSSI:"\r
    },\r
    "initialSetupRSSIValue": {\r
        "message": "$1 %"\r
    },\r
    "initialSetupGPSHead": {\r
        "message": "GPS"\r
    },\r
    "initialSetupInstrumentsHead": {\r
        "message": "仪表"\r
    },\r
    "initialSetupButtonSave": {\r
        "message": "保存"\r
    },\r
    "initialSetupModel": {\r
        "message": "模型: $1"\r
    },\r
    "initialSetupAttitude": {\r
        "message": "$1 度"\r
    },\r
    "initialSetupAccelCalibStarted": {\r
        "message": "开始校准加速度计"\r
    },\r
    "initialSetupAccelCalibEnded": {\r
        "message": "加速度计校准 <span style=\\"color: #37a8db\\">完成</span>"\r
    },\r
    "initialSetupMagCalibStarted": {\r
        "message": "开始校准罗盘"\r
    },\r
    "initialSetupMagCalibEnded": {\r
        "message": "罗盘校准 <span style=\\"color: #37a8db\\">完成</span>"\r
    },\r
    "initialSetupOpflowCalibStarted": {\r
        "message": "开始校准光流计"\r
    },\r
    "initialSetupOpflowCalibEnded": {\r
        "message": "光流计校准 <span style=\\"color: #37a8db\\">完成</span>"\r
    },\r
    "initialSetupSettingsRestored": {\r
        "message": "恢复到<strong>默认</strong>设置"\r
    },\r
    "initialSetupEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
\r
    "RX_PPM": {\r
        "message": "PPM 接收机"\r
    },\r
    "RX_SERIAL": {\r
        "message": "串行数字接收机（SPEKSAT, SBUS, SUMD）"\r
    },\r
    "RX_PWM": {\r
        "message": "PWM 接收机输入 (每个通道都需要接线)"\r
    },\r
    "RX_MSP": {\r
        "message": "MSP 接收机输入（通过 MSP 端口控制）"\r
    },\r
    "RX_SPI": {\r
        "message": "SPI板载接收机 (NRF24L01, RFM22)"\r
    },\r
    "RX_NONE": {\r
        "message": "没有接收机"\r
    },\r
\r
    "featureVBAT": {\r
        "message": "电池电压检测"\r
    },\r
    "featureTX_PROF_SEL": {\r
        "message": "使用遥控器摇杆选择设置档"\r
    },\r
    "featureINFLIGHT_ACC_CAL": {\r
        "message": "实时水平校准"\r
    },\r
    "featureMOTOR_STOP": {\r
        "message": "解锁后处于最低油门时不转动电机"\r
    },\r
    "featureSERVO_TILT": {\r
        "message": "舵机云台"\r
    },\r
    "featureBAT_PROFILE_AUTOSWITCH": {\r
        "message": "自动选择电池类型"\r
    },\r
    "featureBAT_PROFILE_AUTOSWITCHTip": {\r
        "message": "电池插入时，根据电池电压自动选择电池类型"\r
    },\r
    "featureTHR_VBAT_COMP": {\r
        "message": "油门电压补偿"\r
    },\r
    "featureTHR_VBAT_COMPTip": {\r
        "message": "自动补偿电池放电时的电压下降值，以保持相对于油门的推力恒定”  "\r
    },\r
    "featureSOFTSERIAL": {\r
        "message": "启用软串口"\r
    },\r
    "featureSOFTSERIALTip": {\r
        "message": "开启后，请在串口页面设置串口。"\r
    },\r
    "featureGPS": {\r
        "message": "启用 GPS 导航"\r
    },\r
    "featureGPSTip": {\r
        "message": "请先设置串口"\r
    },\r
    "featureFAILSAFE": {\r
        "message": "当接收机信号丢失启用失控保护"\r
    },\r
    "featureSONAR": {\r
        "message": "声呐"\r
    },\r
    "featureTELEMETRY": {\r
        "message": "遥测输出"\r
    },\r
    "featureCURRENT_METER": {\r
        "message": "检测电池电流"\r
    },\r
    "featureREVERSIBLE_MOTORS": {\r
        "message": "3D 模式（配合支持反向转动的电调使用）"\r
    },\r
    "featureRSSI_ADC": {\r
        "message": "模拟 RSSI 输入"\r
    },\r
    "featureLED_STRIP": {\r
        "message": "彩色 RGB LED灯带"\r
    },\r
    "featureDASHBOARD": {\r
        "message": "OLED 显示屏"\r
    },\r
    "featureONESHOT125": {\r
        "message": "ONESHOT 电调支持"\r
    },\r
    "featureONESHOT125Tip": {\r
        "message": "开启前请务必拔掉电池，卸下螺旋桨。"\r
    },\r
    "featurePWM_OUTPUT_ENABLE": {\r
        "message": "开启电机和舵机输出"\r
    },\r
    "featurePWM_OUTPUT_ENABLETip": {\r
        "message": "必需开启此选项之后INAV才会输出信号给电调,这是一种安全措施,防止电机电调和舵机在更新飞控固件之后损坏"\r
    },\r
    "featureBLACKBOX": {\r
        "message": "黑匣子日志记录器"\r
    },\r
    "featureBLACKBOXTip": {\r
        "message": "打开后，请在黑盒日志页面完成设置。"\r
    },\r
    "onboardLoggingBlackbox": {\r
        "message": "黑匣子日志记录设备"\r
    },\r
    "onboardLoggingBlackboxRate": {\r
        "message": "飞行循环迭代到日志的部分(日志速率)"\r
    },\r
    "featureCHANNEL_FORWARDING": {\r
        "message": "转发 Aux 通道信号到舵机输出"\r
    },\r
    "featureSOFTSPI": {\r
        "message": "启用软SPI"\r
    },\r
    "featurePWM_SERVO_DRIVER": {\r
        "message": "外置 PWM 伺服设备"\r
    },\r
    "featurePWM_SERVO_DRIVERTip": {\r
        "message": "在飞控中使用外部PCA9685 PMW驱动器可以连接多达16个舵机飞行控制器。必须连接PCA9685才能启用该特性。"\r
    },\r
    "featureRSSI_ADCTip": {\r
        "message": "RSSI是一种信号强度的测量方法，非常方便，你可以知道你的飞机何时超出了遥控范围，或者是否受到射频干扰。"\r
    },\r
    "featureOSD": {\r
        "message": "OSD"\r
    },\r
    "featureAIRMODE": {\r
        "message": "永久启用 Airmode"\r
    },\r
    "featureFW_LAUNCH": {\r
        "message": "永久启用固定翼的发射模式"\r
    },\r
    "featureFW_AUTOTRIM": {\r
        "message": "在固定翼上连续调整伺服器"\r
    },\r
    "featureFW_AUTOTRIMTip": {\r
        "message": "在自稳模式飞行时，持续调整伺服中点，使飞机在切换到手动模式时保持直线飞行。需要GPS。"\r
    },\r
    "featureDYNAMIC_FILTERS": {\r
        "message": "动态陀螺仪滤波器"\r
    },\r
    "featureDYNAMIC_FILTERSTip": {\r
        "message": "使用自动FFT陀螺分析来设置陷波滤波器来衰减陀螺噪声。应该一直启用!"\r
    },\r
    "configurationFeatureEnabled": {\r
        "message": "启用"\r
    },\r
    "configurationFeatureName": {\r
        "message": "功能"\r
    },\r
    "configurationFeatureDescription": {\r
        "message": "说明"\r
    },\r
    "configurationMixer": {\r
        "message": "混控类型"\r
    },\r
    "configurationFeatures": {\r
        "message": "其他功能"\r
    },\r
    "configurationReceiver": {\r
        "message": "接收机"\r
    },\r
    "configurationRSSI": {\r
        "message": "RSSI（接收机信号强度）"\r
    },\r
    "configurationEscFeatures": {\r
        "message": "电调/电机功能"\r
    },\r
    "serialrx_inverted": {\r
        "message": "串口反相 (与默认协议相比较)"\r
    },\r
    "serialrx_halfduplex": {\r
        "message": "串口接收机 半双工模式"\r
    },\r
    "serialrx_frSkyPitchRollLabel": {\r
        "message": "在遥测中使用俯仰和横滚传感器"\r
    },\r
    "serialrx_frSkyPitchRollHelp": {\r
        "message": "这会发送俯仰和横滚角度遥测传感器的数据，而不是标准的原始加速度计传感器数据。 如果使用 INAV OpenTX/EdgeTX 或 ETHOS 遥测仪表 LUA 脚本，应该将其<strong>开启</strong>。"\r
    },\r
    "serialrx_frSkyFuelUnitLabel": {\r
        "message": "SmartPort 燃油单位"\r
    },\r
    "serialrx_frSkyFuelUnitHelp": {\r
        "message": "选择要发送到 <strong>燃油</strong> 遥测传感器的数据。"\r
    },\r
    "configurationFeaturesHelp": {\r
        "message": "<strong>注意:</strong>并非所有组合功能都有效，当飞控固件侦测到端口有无效的配置时将会复位设置。<br /><strong>注意:</strong><span style=\\"color: red\\">不要</span> 关闭第一个端口的 MSP 功能，除非您确定知道这样做的目的，否则您可能需要重新更新固件并且清空配置"\r
    },\r
    "configurationSerialRXHelp": {\r
        "message": "<strong>注意:</strong> 使用 RX_SERIAL 功能时记得配置串行端口(端口界面) 并且选择接收机协议"\r
    },\r
    "configurationFrSkyOptions": {\r
        "message": "FrSky 选项"\r
    },\r
    "configurationFrSkyOptions_HELP": {\r
        "message": "这些选项提供快速访问，用于配置 SmartPort 遥测传感器，使其能够与 OpenTX/EdgeTX 和 ETHOS 遥测 LUA 脚本配合使用。请注意，如果您使用的是 SBUS，则需要在独立的串口上设置 SmartPort 遥测。"\r
    },\r
    "configurationSensorAlignmentMag": {\r
        "message": "罗盘方向"\r
    },\r
    "configurationSensorAlignmentMagRoll": {\r
        "message": "Roll"\r
    },\r
    "configurationSensorAlignmentMagPitch": {\r
        "message": "Pitch"\r
    },\r
    "configurationSensorAlignmentMagYaw": {\r
        "message": "Yaw"\r
    },\r
    "configurationAccelTrims": {\r
        "message": "加速度计微调"\r
    },\r
    "configurationAccelTrimRoll": {\r
        "message": "加速度计横滚微调"\r
    },\r
    "configurationAccelTrimPitch": {\r
        "message": "加速度计俯仰微调"\r
    },\r
    "configurationMagDeclination": {\r
        "message": "罗盘偏移量 [度]"\r
    },\r
    "configurationAutoDisarmDelay": {\r
        "message": "最低油门几秒后上锁"\r
    },\r
    "configurationAutoDisarmDelayHelp": {\r
        "message": "仅使用摇杆解锁（不使用开关解锁）"\r
    },\r
    "configurationThrottleMinimum": {\r
        "message": "最小油门"\r
    },\r
    "configurationThrottleMid": {\r
        "message": "油门中点 [油门杆中心值]"\r
    },\r
    "configurationThrottleMaximum": {\r
        "message": "最大油门"\r
    },\r
    "configurationThrottleMinimumCommand": {\r
        "message": "电调命令最小值"\r
    },\r
    "configurationVoltageCurrentSensor": {\r
        "message": "电压和电流传感器"\r
    },\r
    "configurationBatteryCurrent": {\r
        "message": "电池电流"\r
    },\r
    "configurationVoltageSource": {\r
        "message": "用于报警和遥测的电压源"\r
    },\r
    "configurationVoltageSourceHelp": {\r
        "message": "原始电压是直接从电池读取的电压。凹陷补偿电压是计算电池在无负载时应处于的电压(模拟理想电池，应消除高负载引起的虚警)。"\r
    },\r
    "configurationBatteryCells": {\r
        "message": "电芯数量 (0 = 自动检测)"\r
    },\r
    "configurationBatteryCellsHelp": {\r
        "message": "将此设置为电池的电芯数，以禁用自动电池计数检测或使其可能自动切换电池配置文件。7S、9S和11S电池无法自动检测。"\r
    },\r
    "configurationBatteryCellDetectVoltage": {\r
        "message": "电池计数检测的最大电芯电压"\r
    },\r
    "configurationBatteryCellDetectVoltageHelp": {\r
        "message": "最大电芯电压用于电池计数自动检测。应高于最大电池电压，以考虑测量电压中可能的漂移，并保持电池计数检测的准确性。"\r
    },\r
    "configurationBatteryMinimum": {\r
        "message": "单片电芯最小电压"\r
    },\r
    "configurationBatteryMaximum": {\r
        "message": "单片电芯最大电压"\r
    },\r
    "configurationBatteryWarning": {\r
        "message": "单片电芯警告电压"\r
    },\r
    "configurationBatteryScale": {\r
        "message": "电压计比例:"\r
    },\r
    "configurationBatteryVoltage": {\r
        "message": "电池电压："\r
    },\r
    "configurationCurrentScale": {\r
        "message": "电流计比例"\r
    },\r
    "configurationCurrentScaleHelp": {\r
        "message": "输出电压等级为毫安 [1/10th mV/A]"\r
    },\r
    "configurationCurrentOffset": {\r
        "message": "偏移量"\r
    },\r
    "configurationBatteryMultiwiiCurrent": {\r
        "message": "启用对传统多旋翼 MSP电流输出的支持"\r
    },\r
    "configurationBatterySettings": {\r
        "message": "电池设置"\r
    },\r
    "configurationBatterySettingsHelp": {\r
        "message": "这些设置适用于当前选定的电池配置文件 "\r
    },\r
    "configurationBatteryCapacityValue": {\r
        "message": "容量"\r
    },\r
    "configurationBatteryCapacityWarning": {\r
        "message": "警告容量 (剩余 %)"\r
    },\r
    "configurationBatteryCapacityCritical": {\r
        "message": "危险容量 (剩余 %)"\r
    },\r
    "configurationBatteryCapacityUnit": {\r
        "message": "电池容量单位"\r
    },\r
    "configurationLaunch": {\r
        "message": "固定翼发射设置"\r
    },\r
    "configurationLaunchVelocity": {\r
        "message": "发射启动速度 "\r
    },\r
    "configurationLaunchVelocityHelp": {\r
        "message": "摆动发射探测前向速度阈值。默认: 300 [100-10000]"\r
    },\r
    "configurationLaunchAccel": {\r
        "message": "加速度阈值 "\r
    },\r
    "configurationLaunchAccelHelp": {\r
        "message": "弹射或抛掷的的加速度阈值, 1G = 981 cm/s/s. 默认: 1863 [1000-20000]"\r
    },\r
    "configurationLaunchMaxAngle": {\r
        "message": "最大抛出角度 "\r
    },\r
    "configurationLaunchMaxAngleHelp": {\r
        "message": "考虑发射成功的最大投掷角度(俯仰/滚转结合)。设置为180完全禁用。默认值:: 45 [5-180]"\r
    },\r
    "configurationLaunchDetectTime": {\r
        "message": "检测时间 "\r
    },\r
    "configurationLaunchDetectTimeHelp": {\r
        "message": "突破加速度阈值才触发 发射模式 的检测时间。默认: 40 [10-1000]"\r
    },\r
    "configurationLaunchThr": {\r
        "message": "发射油门 "\r
    },\r
    "configurationLaunchThrHelp": {\r
        "message": "发射油门 - 在发射过程中的油门值 。默认: 1700 [1000-2000]"\r
    },\r
    "configurationLaunchIdleThr": {\r
        "message": "怠速油门 "\r
    },\r
    "configurationLaunchIdleThrHelp": {\r
        "message": "怠速油门-在发射序列启动之前设置的油门。如果设置低于最小油门，它将强制电机停止或在怠速油门(取决于是否启动MOTOR_STOP)。如果设置在最小油门以上，它将强制油门到这个值(如果MOTOR_STOP是启用的，它将根据油门的位置处理)。 默认: 1000 [1000-2000]"\r
    },\r
    "configurationLaunchIdleDelay": {\r
        "message": "怠速油门延迟"\r
    },\r
    "configurationLaunchIdleDelayHelp": {\r
        "message": "设置发射时电机从怠速油门启动到发射油门之间的时间延迟。默认值: 0 [0-60000]"\r
    },\r
    "configurationLaunchMotorDelay": {\r
        "message": "油门延迟 "\r
    },\r
    "configurationLaunchMotorDelayHelp": {\r
        "message": "检测到发射动作后到油门启动之间的延迟时间。默认值:500  [0 - 5000]"\r
    },\r
    "configurationLaunchSpinupTime": {\r
        "message": "电机加速时间 "\r
    },\r
    "configurationLaunchSpinupTimeHelp": {\r
        "message": "飞控控制从最小油门升到起飞油门的时间间隔，减小电调和桨在突然加速中的压力. Default: 100 [0-1000]"\r
    },\r
    "configurationLaunchMinTime": {\r
        "message": "最小发射启动时间  "\r
    },\r
    "configurationLaunchMinTimeHelp": {\r
        "message": "触发发射模式执行所需的时间 [ms]，忽略不经意的移动。 默认: 0 [0-60000]"\r
    },\r
    "configurationLaunchTimeout": {\r
        "message": "发射超时 "\r
    },\r
    "configurationLaunchTimeoutHelp": {\r
        "message": "执行发射模式的最大时间。在这个时间内若都没有触发发射，发射模式将被关闭，常规飞行模式将接管。默认: 5000 [0-60000]"\r
    },\r
    "configurationLaunchEndTime": {\r
        "message": "结束过渡时间 "\r
    },\r
    "configurationLaunchEndTimeHelp": {\r
        "message": "启动结束时的平稳过渡时间(毫秒)。这被添加到启动超时。默认: 2000 [0-5000]"\r
    },\r
    "configurationLaunchMaxAltitude": {\r
        "message": "最大高度 "\r
    },\r
    "configurationLaunchMaxAltitudeHelp": {\r
        "message": "在发射模式将被关闭后常规飞行模式将接管的高度。默认: 0 [0-60000]"\r
    },\r
    "configurationLaunchClimbAngle": {\r
        "message": "爬升角度"\r
    },\r
    "configurationLaunchClimbAngleHelp": {\r
        "message": "发射时的爬升角度 (模型姿态，不是爬升速率) ,也受到全局最大倾斜角 max_angle_inclination_pit 的约束。默认: 18 [5-45]"\r
    },\r
    "configuration3d": {\r
        "message": "3D电机"\r
    },\r
    "configuration3dDeadbandLow": {\r
        "message": "3D电机油门低值死区"\r
    },\r
    "configuration3dDeadbandHigh": {\r
        "message": "3D电机油门高值死区"\r
    },\r
    "configuration3dNeutral": {\r
        "message": "3D电机油门中位"\r
    },\r
    "configuration3dDeadbandThrottle": {\r
        "message": "3D电机油门死区"\r
    },\r
    "configurationSystem": {\r
        "message": "系统设置"\r
    },\r
    "configurationLoopTime": {\r
        "message": "飞控循环时间"\r
    },\r
    "configurationCalculatedCyclesSec": {\r
        "message": "循环/秒[Hz]"\r
    },\r
    "configurationGPS": {\r
        "message": "配置"\r
    },\r
    "configurationGPSProtocol": {\r
        "message": "通信协议"\r
    },\r
    "configurationGPSUseGalileo": {\r
        "message": "使用伽利略卫星进行GPS定位 (EU)"\r
    },\r
    "configurationGPSUseBeidou": {\r
        "message": "使用北斗卫星进行GPS定位 (CN)"\r
    },\r
    "configurationGPSUseGlonass": {\r
        "message": "使用格洛纳斯卫星进行GPS定位 (RU)"\r
    },\r
    "tzOffset": {\r
        "message": "时区偏移"\r
    },\r
    "tzOffsetHelp": {\r
        "message": "UTC时区偏移量。用于黑匣子日志的GPS时间记录和时间戳。(默认值= 0)"\r
    },\r
    "tzAutomaticDST": {\r
        "message": "自动夏令时"\r
    },\r
    "tzAutomaticDSTHelp": {\r
        "message": "自动添加夏令时到GPS时间时，需要或简单地忽略它。包括欧盟和美国的预设-如果你住在这些地区以外，建议通过tz_offset手动管理DST。(默认=OFF)"\r
    },\r
    "configurationGPSBaudrate": {\r
        "message": "波特率"\r
    },\r
    "configurationGPSubxSbas": {\r
        "message": "地面辅助类型"\r
    },\r
    "receiverType": {\r
        "message": "接收机类型"\r
    },\r
    "configurationSerialRX": {\r
        "message": "串行接收机协议"\r
    },\r
    "configurationSPIProtocol": {\r
        "message": "SPI 接收机协议"\r
    },\r
    "configurationEepromSaved": {\r
        "message": "EEPROM 配置： <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
    "configurationButtonSave": {\r
        "message": "保存并重启"\r
    },\r
    "configurationVTX": {\r
        "message": "VTX"\r
    },\r
    "configurationVTXBand": {\r
        "message": "频段"\r
    },\r
    "configurationNoBand": {\r
        "message": "None"\r
    },\r
    "configurationVTXNoBandHelp": {\r
        "message": "已手动设置VTX频率。选择一个频段将覆盖当前配置的频率。"\r
    },\r
    "configurationVTXChannel": {\r
        "message": "频道"\r
    },\r
    "configurationVTXPower": {\r
        "message": "功率等级"\r
    },\r
    "configurationVTXPowerHelp": {\r
        "message": "VTX功率等级。具体功率mw(或dBm)取决于图传硬件。检查你的图传说明书。"\r
    },\r
    "configurationVTXLowerPowerDisarm": {\r
        "message": "当飞行器上锁时切换为低功率"\r
    },\r
    "configurationVTXLowerPowerDisarmHelp": {\r
        "message": "启用这个选项将使VTX在飞行器在上锁时使用最低功率。使用‘直到第一次解锁，使它只使用最低的功率，直到你第一次解锁飞行器。"\r
    },\r
    "configurationVTXLowPowerDisarmValue_0": {\r
        "message": "禁用"\r
    },\r
    "configurationVTXLowPowerDisarmValue_1": {\r
        "message": "永远"\r
    },\r
    "configurationVTXLowPowerDisarmValue_2": {\r
        "message": "直到第一次解锁"\r
    },\r
    "configurationGimbal": {\r
        "message": "串口云台"\r
    },\r
    "configurationGimbalSensitivity": {\r
        "message": "云台灵敏度"\r
    },\r
    "configurationGimbalPanChannel": {\r
        "message": "水平通道（偏航）"\r
    },\r
    "configurationGimbalTiltChannel": {\r
        "message": "俯仰通道（俯仰）"\r
    },\r
    "configurationGimbalRollChannel": {\r
        "message": "横滚通道"\r
    },\r
    "configurationHeadtracker": {\r
        "message": "头部跟踪器"\r
    },\r
    "configurationHeadtrackerType": {\r
        "message": "头部跟踪器类型"\r
    },\r
    "configurationHeadtrackerPanRatio": {\r
        "message": "头部跟踪器水平"\r
    },\r
    "configurationHeadtrackerTiltRatio": {\r
        "message": "头部跟踪器俯仰移动比例"\r
    },\r
    "configurationHeadtrackerRollRatio": {\r
        "message": "头部跟踪器横滚移动比例"\r
    },\r
    "portsHelp": {\r
        "message": "<strong>注意:</strong> 并非所有组合功能都有效，当飞控检测到端口冲突时便会重置这个端口的设置(<span style=\\"color: red\\">一个UART端口只能设置一个功能,同时设置两个功能，保存后会重置所有端口设置</span>)"\r
    },\r
    "portsFirmwareUpgradeRequired": {\r
        "message": "固件 <span style=\\"color: red\\">需要</span> 升级"\r
    },\r
    "portsButtonSave": {\r
        "message": "保存并重启"\r
    },\r
    "portsTelemetryDisabled": {\r
        "message": "关闭"\r
    },\r
    "portsFunction_MSP": {\r
        "message": "MSP"\r
    },\r
    "portsFunction_GPS": {\r
        "message": "GPS"\r
    },\r
    "portsFunction_RANGEFINDER": {\r
        "message": "测距仪"\r
    },\r
    "portsFunction_OPFLOW": {\r
        "message": "光流计"\r
    },\r
    "portsFunction_ESC": {\r
        "message": "ESC output/telemetry"\r
    },\r
    "portsFunction_TELEMETRY_FRSKY": {\r
        "message": "FrSky"\r
    },\r
    "portsFunction_TELEMETRY_HOTT": {\r
        "message": "HoTT"\r
    },\r
    "portsFunction_TELEMETRY_LTM": {\r
        "message": "LTM"\r
    },\r
    "portsFunction_TELEMETRY_MAVLINK": {\r
        "message": "MAVLink"\r
    },\r
    "portsFunction_TELEMETRY_IBUS": {\r
        "message": "IBUS"\r
    },\r
    "portsFunction_GSM_SMS": {\r
        "message": "GSM SMS"\r
    },\r
    "portsFunction_TELEMETRY_MSP": {\r
        "message": "MSP"\r
    },\r
    "portsFunction_TELEMETRY_SMARTPORT": {\r
        "message": "SmartPort"\r
    },\r
    "portsFunction_SMARTPORT_MASTER": {\r
        "message": "SmartPort Master"\r
    },\r
    "portsFunction_RX_SERIAL": {\r
        "message": "串行数字接收机"\r
    },\r
    "portsFunction_BLACKBOX": {\r
        "message": "黑匣子"\r
    },\r
    "portsFunction_RUNCAM_DEVICE_CONTROL": {\r
        "message": "RunCam Device"\r
    },\r
    "portsFunction_TBS_SMARTAUDIO": {\r
        "message": "TBS SmartAudio"\r
    },\r
    "portsFunction_IRC_TRAMP": {\r
        "message": "IRC Tramp"\r
    },\r
    "portsFunction_VTX_FFPV": {\r
        "message": "FuriousFPV Vtx"\r
    },\r
    "portsFunction_FRSKY_OSD": {\r
        "message": "FrSky OSD"\r
    },\r
    "portsFunction_DJI_FPV": {\r
        "message": "DJI FPV VTX"\r
    },\r
    "portsFunction_MSP_DISPLAYPORT": {\r
        "message": "MSP DisplayPort"\r
    },\r
    "portsFunction_SBUS_OUTPUT": {\r
        "message": "SBus Output"\r
    },\r
    "portsFunction_GIMBAL": {\r
        "message": "Serial Gimbal"\r
    },\r
    "portsFunction_HEADTRACKER": {\r
        "message": "Serial Headtracker"\r
    },\r
    "pidTuning_Other": {\r
        "message": "Other"\r
    },\r
    "pidTuning_Limits": {\r
        "message": "Limits"\r
    },\r
    "pidTuning_HeadingHold_Rate": {\r
        "message": "Heading Hold Rate (°/s)"\r
    },\r
    "pidTuning_Max_Inclination_Angle": {\r
        "message": "Max Inclination Angle"\r
    },\r
    "pidTuning_Max_Roll": {\r
        "message": "Roll (°/10)"\r
    },\r
    "pidTuning_Max_Pitch": {\r
        "message": "Pitch (°/10)"\r
    },\r
    "pidTuning_ShowAllPIDs": {\r
        "message": "显示所有pid"\r
    },\r
    "pidTuning_PIDmain": {\r
        "message": "主PID增益"\r
    },\r
    "pidTuning_PIDother": {\r
        "message": "附加PID增益"\r
    },\r
    "pidTuning_SelectNewDefaults": {\r
        "message": "选择新默认值"\r
    },\r
    "pidTuning_ResetPIDController": {\r
        "message": "重置PID控制器"\r
    },\r
    "pidTuning_PIDgains": {\r
        "message": "PID增益"\r
    },\r
    "pidTuning_Name": {\r
        "message": "名称"\r
    },\r
    "pidTuning_Proportional": {\r
        "message": "比例(P)"\r
    },\r
    "pidTuning_Integral": {\r
        "message": "积分(I)"\r
    },\r
    "pidTuning_Derivative": {\r
        "message": "微分(D)"\r
    },\r
    "pidTuning_FeedForward": {\r
        "message": "前馈"\r
    },\r
    "pidTuning_ControlDerivative": {\r
        "message": "控制导数"\r
    },\r
    "pidTuning_Basic": {\r
        "message": "Basic/Acro"\r
    },\r
    "pidTuning_Level": {\r
        "message": "Angle/Horizon"\r
    },\r
    "pidTuning_Altitude": {\r
        "message": "Barometer & Sonar/Altitude"\r
    },\r
    "pidTuning_Mag": {\r
        "message": "Magnometer/Heading"\r
    },\r
    "pidTuning_GPS": {\r
        "message": "GPS导航"\r
    },\r
    "pidTuning_LevelP": {\r
        "message": "强度"\r
    },\r
    "pidTuning_LevelI": {\r
        "message": "LPF 低通滤波截止频率(Hz)"\r
    },\r
    "pidTuning_LevelD": {\r
        "message": "过渡（地平线）"\r
    },\r
    "pidTuning_LevelHelp": {\r
        "message": "下面的值改变了自稳和半自稳飞行模式的行为。不同的PID控制器处理LEVEL值不同。请检查文件。"\r
    },\r
    "pidTuning_RatesAndExpo": {\r
        "message": "Rates & Expo"\r
    },\r
    "pidTuning_Rates_Stabilized": {\r
        "message": "Stabilized Rates"\r
    },\r
    "pidTuning_Rates_Roll": {\r
        "message": "Roll (°/s)"\r
    },\r
    "pidTuning_Rates_Pitch": {\r
        "message": "Pitch (°/s)"\r
    },\r
    "pidTuning_Rates_Yaw": {\r
        "message": "Yaw (°/s)"\r
    },\r
    "pidTuning_Expo_Stabilized": {\r
        "message": "Stabilized Expo"\r
    },\r
    "pidTuning_Expo_Manual": {\r
        "message": "Manual Expo"\r
    },\r
    "pidTuning_Expo_RollPitch": {\r
        "message": "Roll & Pitch (%)"\r
    },\r
    "pidTuning_Expo_Yaw": {\r
        "message": "Yaw (%)"\r
    },\r
    "pidTuning_RateDynamics": {\r
        "message": "Rate Dynamics"\r
    },\r
    "pidTuning_RateDynamics_Sensitivity": {\r
        "message": "灵敏度"\r
    },\r
    "pidTuning_RateDynamics_Correction": {\r
        "message": "校正"\r
    },\r
    "pidTuning_RateDynamics_Weight": {\r
        "message": "权重"\r
    },\r
    "pidTuning_RateDynamics_Center": {\r
        "message": "中心"\r
    },\r
    "pidTuning_RateDynamics_End": {\r
        "message": "末端"\r
    },\r
    "pidTuning_RollPitchRate": {\r
        "message": "横滚和俯仰速率"\r
    },\r
    "pidTuning_RollRate": {\r
        "message": "横滚速率"\r
    },\r
    "pidTuning_PitchRate": {\r
        "message": "俯仰速率"\r
    },\r
    "pidTuning_YawRate": {\r
        "message": "偏航速率"\r
    },\r
    "pidTuning_RollAndPitchExpo": {\r
        "message": "Roll & Pitch Expo"\r
    },\r
    "pidTuning_YawExpo": {\r
        "message": "Yaw Expo"\r
    },\r
    "pidTuning_MaxRollAngle": {\r
        "message": "最大横滚角度"\r
    },\r
    "pidTuning_MaxRollAngleHelp": {\r
        "message": "自稳模式下的最大滚转角。这也限制了返航模式中的最大倾斜度。"\r
    },\r
    "pidTuning_MaxPitchAngle": {\r
        "message": "最大俯仰角度"\r
    },\r
    "pidTuning_MaxPitchAngleHelp": {\r
        "message": "自稳模式下的最大俯仰角。这也限制了返航模式中的最大俯仰角度。"\r
    },\r
    "pidTuning_ManualRollRate": {\r
        "message": "手动横滚速率"\r
    },\r
    "pidTuning_ManualPitchRate": {\r
        "message": "手动俯仰速率"\r
    },\r
    "pidTuning_ManualYawRate": {\r
        "message": "手动偏航速率"\r
    },\r
    "pidTuning_magHoldYawRate": {\r
        "message": "航向保持率限制"\r
    },\r
    "pidTuning_MagHoldYawRateHelp": {\r
        "message": "MagHold控制器可以从无人机要求的最大偏航旋转速率。仅在启用MagHold模式时使用，在返航和航点飞行导航期间使用。值低于30dps会给出很好的\\"过场动画\\"画面"\r
    },\r
    "pidTuning_Filters": {\r
        "message": "滤波器"\r
    },\r
    "pidTuning_mainFilters": {\r
        "message": "陀螺仪滤波器"\r
    },\r
    "pidTuning_advancedFilters": {\r
        "message": "高级陀螺仪滤波器"\r
    },\r
    "pidTuning_gyro_main_lpf_hz": {\r
        "message": "主陀螺仪滤波器截止频率"\r
    },\r
    "pidTuning_gyro_main_lpf_hz_help": {\r
        "message": "较高的值提供较低的延迟但更多的噪音。较低的值提供较少的噪音，但在陀螺仪处理上增加了更多的延迟"\r
    },\r
    "pidTuning_MatrixFilterMinFrequency": {\r
        "message": "矩阵滤波器最小频率"\r
    },\r
    "pidTuning_MatrixFilterMinFrequencyHelp": {\r
        "message": "矩阵滤波器的最小频率。该值应取决于螺旋桨的大小。150Hz适用于5英寸及以下的螺旋桨。对于7英寸及以上的螺旋桨，则应将其降低至100Hz以下。"\r
    },\r
    "pidTuning_MatrixFilterQFactor": {\r
        "message": "矩阵滤波器Q因数"\r
    },\r
    "pidTuning_MatrixFilterQFactorHelp": {\r
        "message": "Q值越高，矩阵滤波器的选择性就越高。建议在150和300之间选择值。"\r
    },\r
    "pidTuning_UnicornFilterQFactor": {\r
        "message": "Unicorn 滤波器Q因数"\r
    },\r
    "pidTuning_dtermFilters": {\r
        "message": "D-term 滤波器"\r
    },\r
    "pidTuning_dtermLpfCutoffFrequency": {\r
        "message": "D-term LPF 低通滤波器截止频率"\r
    },\r
    "pidTuning_dtermLpfCutoffFrequencyHelp": {\r
        "message": "所有PID控制器的D-term低通截止滤波器。"\r
    },\r
    "pidTuning_rpmFilters": {\r
        "message": "陀螺仪RPM滤波器"\r
    },\r
    "pidTuning_rpm_gyro_filter_enabled": {\r
        "message": "陀螺仪RPM滤波器（需要ESC遥测）"\r
    },\r
    "pidTuning_rpm_gyro_min_hz": {\r
        "message": "陀螺仪RPM滤波器最小频率"\r
    },\r
    "pidTuning_Mechanics": {\r
        "message": "机械特性"\r
    },\r
    "pidTuning_ITermMechanics": {\r
        "message": "I-term 机械特性"\r
    },\r
    "pidTuning_itermRelaxCutoff": {\r
        "message": "Iterm Relax 截止频率"\r
    },\r
    "pidTuning_itermRelaxCutoffHelp": {\r
        "message": "更低的值打开一个更长的时间窗口，使I-term Relax工作，同时增强I-term抑制。更高的值缩短时间窗口并减少抑制。"\r
    },\r
    "pidTuning_antigravityGain": {\r
        "message": "反重力增益"\r
    },\r
    "pidTuning_antigravityAccelerator": {\r
        "message": "反重力加速器"\r
    },\r
    "pidTuning_antigravityCutoff": {\r
        "message": "反重力截止频率"\r
    },\r
    "pidTuning_itermBankAngleFreeze": {\r
        "message": "Yaw I-term 冻结倾斜角度"\r
    },\r
    "pidTuning_itermBankAngleFreezeHelp": {\r
        "message": "当飞机倾斜角度超过此值时，冻结偏航I-term。这有助于防止舵对转向的反作用。0表示禁用此功能。仅适用于固定翼飞行器。"\r
    },\r
    "pidTuning_dTermMechanics": {\r
        "message": "D-term 机械特性"\r
    },\r
    "pidTuning_d_boost_min": {\r
        "message": "最小D-Boost比例"\r
    },\r
    "pidTuning_d_boost_min_help": {\r
        "message": "定义杆子加速阶段允许的最大Dterm衰减。1.0表示Dterm不会衰减。0.5表示它允许缩小一半。较低的值在快速杆移动期间导致更快的响应。 "\r
    },\r
    "pidTuning_d_boost_max": {\r
        "message": "最大D-Boost比例"\r
    },\r
    "pidTuning_d_boost_max_help": {\r
        "message": "定义到达最大角加速度时的最大Dterm增强。1.0表示D-Boost已禁用，2.0表示允许Dterm增长100％。 1.5到1.7之间的值通常是最佳选择。"\r
    },\r
    "pidTuning_d_boost_max_at_acceleration": {\r
        "message": "加速度最大D-Boost值[dps^2]"\r
    },\r
    "pidTuning_d_boost_max_at_acceleration_help": {\r
        "message": "在角加速度（由陀螺仪或速率目标检测）达到给定加速度时，D-Boost完全活动。在0和此值之间，D-Boost因子按线性缩放。"\r
    },\r
    "pidTuning_d_boost_gyro_delta_lpf_hz": {\r
        "message": "D-Boost陀螺仪LPF"\r
    },\r
    "pidTuning_d_boost_gyro_delta_lpf_hz_help": {\r
        "message": "应设置为螺旋桨清洗振荡的频率。5英寸四轴飞行器最好在80Hz左右工作，7英寸四轴飞行器最好在50Hz左右。"\r
    },\r
    "pidTuning_tpaMechanics": {\r
        "message": "推力PID衰减"\r
    },\r
    "pidTuning_TPA": {\r
        "message": "推力PID衰减（TPA）"\r
    },\r
    "pidTuning_TPABreakPoint": {\r
        "message": "TPA 起始点"\r
    },\r
    "pidTuning_FW_TPATimeConstant": {\r
        "message": "固定翼TPA时间常数"\r
    },\r
    "pidTuning_FW_TPATimeConstantHelp": {\r
        "message": "TPA平滑和延迟时间常数反映飞机的非瞬时速度/油门响应。"\r
    },\r
    "pidTuning_fwLevelTrimMechanics": {\r
        "message": "固定翼水平调整"\r
    },\r
    "pidTuning_fw_level_pitch_trim": {\r
        "message": "水平调整 [deg]"\r
    },\r
    "pidTuning_fw_level_pitch_trim_help": {\r
        "message": "自动水平飞行模式的俯仰调整。角度，+5表示机头应该抬高5度。"\r
    },\r
    "pidTuning_ButtonSave": {\r
        "message": "保存"\r
    },\r
    "pidTuning_ButtonRefresh": {\r
        "message": "刷新"\r
    },\r
    "pidTuning_ProfileHead": {\r
        "message": "PID 配置文件"\r
    },\r
    "pidTuning_LoadedProfile": {\r
        "message": "加载配置文件: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "pidTuning_Manual_Rates": {\r
        "message": "Manual Rates"\r
    },\r
    "pidTuning_Manual_Roll": {\r
        "message": "Roll (%)"\r
    },\r
    "pidTuning_Manual_Pitch": {\r
        "message": "Pitch (%)"\r
    },\r
    "pidTuning_Manual_Yaw": {\r
        "message": "Yaw (%)"\r
    },\r
    "pidTuning_gyro_use_dyn_lpf": {\r
        "message": "动态陀螺仪低通滤波器"\r
    },\r
    "pidTuning_gyro_use_dyn_lpf_help": {\r
        "message": "启用后，主陀螺仪低通滤波器频率将根据当前油门位置自动调整。禁用时，使用静态低通滤波器截止频率。"\r
    },\r
    "pidTuning_gyro_dyn_lpf_min_hz": {\r
        "message": "动态陀螺仪低通滤波最小截止频率"\r
    },\r
    "pidTuning_gyro_dyn_lpf_max_hz": {\r
        "message": "动态陀螺仪低通滤波最大截止频率"\r
    },\r
    "pidTuning_gyro_dyn_lpf_curve_expo": {\r
        "message": "动态陀螺仪低通滤波曲线，指数部分"\r
    },\r
    "pidTuning_gyro_dyn_lpf_min_hz_help": {\r
        "message": "定义最小油门时的陀螺仪低通滤波器截止频率。当油门增加时，截止频率也随之增加，直到最大截止频率。"\r
    },\r
    "pidTuning_gyro_dyn_lpf_max_hz_help": {\r
        "message": "定义最大油门时的陀螺仪低通滤波器截止频率。当油门减小时，截止频率也随之减小，直到最小截止频率。"\r
    },\r
    "loadedMixerProfile": {\r
        "message": "加载混控配置文件: <strong style=\\"color: #37a8db\\">$1</strong>, 检查模式选项卡:混合器配置文件2,如果您没有看到变化"\r
    },\r
    "loadedBatteryProfile": {\r
        "message": "加载电池配置文件: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setControlProfile" : {\r
        "message": "设置控制配置文件: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setMixerProfile": {\r
        "message": "设置混控配置文件: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "setBatteryProfile": {\r
        "message": "设置电池配置文件: <strong style=\\"color: #37a8db\\">$1</strong>"\r
    },\r
    "pidTuningDataRefreshed": {\r
        "message": "PID 数据 <strong>已刷新</strong>"\r
    },\r
    "pidTuningEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>: PID 调整"\r
    },\r
\r
    "receiverHelp": {\r
        "message": "请阅读文档的接收机部分。 按需配置好串口、接收机模式（serial/ppm/pwm），接收机协议，对频好接收机，设置好通道映射，配置通道的最小最大值范围让它们可以覆盖1000到2000。设置中位值（默认1500），微调通道到1500，配置摇杆死区，确认当遥控器关闭或超出范围时接收机的行为（失控保护）。<br /><span class=\\"message-negative\\">重要：</span> 飞行前阅读文档的失控保护章节并且配置好失控保护。"\r
    },\r
    "receiverThrottleMid": {\r
        "message": "油门中位"\r
    },\r
    "receiverThrottleExpo": {\r
        "message": "油门曲线"\r
    },\r
    "receiverRcRate": {\r
        "message": "RC Rate"\r
    },\r
    "receiverDeadband": {\r
        "message": "遥控器死区"\r
    },\r
    "receiverHelpDeadband": {\r
        "message": "对于输出有抖动的发射机，如果rc输入在空闲时抽搐，这个值可以增加。"\r
    },\r
    "receiverHelpYawDeadband": {\r
        "message": "对于输出有抖动的发射机，如果rc输入在空闲时抽搐，这个值可以增加。<strong>该设置仅适用于偏航。</strong>"\r
    },\r
    "receiverYawDeadband": {\r
        "message": "偏航死区"\r
    },\r
    "receiverRcExpo": {\r
        "message": "遥控器曲线"\r
    },\r
    "receiverRcYawExpo": {\r
        "message": "遥控器偏航曲线"\r
    },\r
    "receiverManualRcExpo": {\r
        "message": "手动遥控曲线"\r
    },\r
    "receiverManualRcYawExpo": {\r
        "message": "手动遥控偏航曲线"\r
    },\r
    "receiverChannelMap": {\r
        "message": "通道映射"\r
    },\r
    "receiverChannelMapTitle": {\r
        "message": "您可以通过单击框内的内容来定义自己的通道映射"\r
    },\r
    "receiverRssiChannel": {\r
        "message": "RSSI通道"\r
    },\r
    "receiverRssiSource": {\r
        "message": "RSSI来源"\r
    },\r
    "receiverRefreshRateTitle": {\r
        "message": "图像刷新率"\r
    },\r
    "receiverButtonSave": {\r
        "message": "保存"\r
    },\r
    "receiverButtonRefresh": {\r
        "message": "刷新"\r
    },\r
    "receiverButtonSticks": {\r
        "message": "遥杆"\r
    },\r
    "receiverDataRefreshed": {\r
        "message": "RC调整数据 <strong>已刷新</strong>"\r
    },\r
    "receiverEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>: 接收机"\r
    },\r
\r
    "auxiliaryHelp": {\r
        "message": "定义遥控器上开关的功能，当接收机通道信号介于范围内时将启动该功能，请记得按下保存键"\r
    },\r
    "auxiliaryToggleUnused": {\r
        "message": "隐藏未使用的模式"\r
    },\r
    "auxiliaryMin": {\r
        "message": "最小"\r
    },\r
    "auxiliaryMax": {\r
        "message": "最大"\r
    },\r
    "auxiliaryAddRange": {\r
        "message": "添加范围"\r
    },\r
    "auxiliaryAutoChannelSelect": {\r
        "message": "自动"\r
    },\r
    "auxiliaryButtonSave": {\r
        "message": "保存"\r
    },\r
    "auxiliaryEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
    "eepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
    "adjustmentsHelp": {\r
        "message": "配置调整开关。请参阅文档中有关飞行中调整的章节，调整功能所做的变更不会自动储存，总共有 4 个插槽，每个开关都需要有各自的插槽"\r
    },\r
    "adjustmentsExamples": {\r
        "message": "示例"\r
    },\r
    "adjustmentsExample1": {\r
        "message": " 在 CH5 使用 1 号插槽和 1 个 3 位开关来选择俯仰或滚转的 PID，在 CH6 使用另一个 3 位开关来增加或减少数值"\r
    },\r
    "adjustmentsExample2": {\r
        "message": "在 CH8 使用 2 号插槽和 1 个 3 位开关来选择开启速率设置档，透过相同通道上的 3 位开关来选择"\r
    },\r
    "adjustmentsColumnEnable": {\r
        "message": "如果开启"\r
    },\r
    "adjustmentsColumnUsingSlot": {\r
        "message": "使用插槽"\r
    },\r
    "adjustmentsColumnWhenChannel": {\r
        "message": "这个通道"\r
    },\r
    "adjustmentsColumnIsInRange": {\r
        "message": "在这个范围"\r
    },\r
    "adjustmentsColumnThenApplyFunction": {\r
        "message": "则启用功能"\r
    },\r
    "adjustmentsColumnViaChannel": {\r
        "message": "通过通道"\r
    },\r
    "adjustmentsSlot0": {\r
        "message": "1号插槽"\r
    },\r
    "adjustmentsSlot1": {\r
        "message": "3号插槽"\r
    },\r
    "adjustmentsSlot2": {\r
        "message": "3号插槽"\r
    },\r
    "adjustmentsSlot3": {\r
        "message": "4号插槽"\r
    },\r
    "adjustmentsMin": {\r
        "message": "最小"\r
    },\r
    "adjustmentsMax": {\r
        "message": "最大"\r
    },\r
    "adjustmentsGroupRates": {\r
        "message": "Rates & Expo"\r
    },\r
    "adjustmentsGroupPIDTuning": {\r
        "message": "PID 调整"\r
    },\r
    "adjustmentsGroupNavigationFlight": {\r
        "message": "导航和飞行"\r
    },\r
    "adjustmentsGroupMisc": {\r
        "message": "Misc"\r
    },\r
    "adjustmentsFunction0": {\r
        "message": "没有改变"\r
    },\r
    "adjustmentsFunction1": {\r
        "message": "遥控器速率调整"\r
    },\r
    "adjustmentsFunction2": {\r
        "message": "遥控器曲线调整"\r
    },\r
    "adjustmentsFunction3": {\r
        "message": "油门曲线调整"\r
    },\r
    "adjustmentsFunction4": {\r
        "message": "俯仰 & 横滚速率调整"\r
    },\r
    "adjustmentsFunction5": {\r
        "message": "偏航速率调整"\r
    },\r
    "adjustmentsFunction6": {\r
        "message": "俯仰 & 横滚 P 调整"\r
    },\r
    "adjustmentsFunction7": {\r
        "message": "俯仰 & 横滚 I 调整"\r
    },\r
    "adjustmentsFunction8": {\r
        "message": "俯仰 & 横滚 D 调整"\r
    },\r
    "adjustmentsFunction9": {\r
        "message": "俯仰 & 横滚 CD/FF 调整"\r
    },\r
    "adjustmentsFunction10": {\r
        "message": "俯仰 P 调整"\r
    },\r
    "adjustmentsFunction11": {\r
        "message": "俯仰 I 调整"\r
    },\r
    "adjustmentsFunction12": {\r
        "message": "俯仰 D 调整"\r
    },\r
    "adjustmentsFunction13": {\r
        "message": "俯仰 CD/FF 调整"\r
    },\r
    "adjustmentsFunction14": {\r
        "message": "横滚 P 调整"\r
    },\r
    "adjustmentsFunction15": {\r
        "message": "横滚 I 调整"\r
    },\r
    "adjustmentsFunction16": {\r
        "message": "横滚 D 调整"\r
    },\r
    "adjustmentsFunction17": {\r
        "message": "横滚 CD/FF 调整"\r
    },\r
    "adjustmentsFunction18": {\r
        "message": "偏航 P 调整"\r
    },\r
    "adjustmentsFunction19": {\r
        "message": "偏航 I 调整"\r
    },\r
    "adjustmentsFunction20": {\r
        "message": "偏航 D 调整"\r
    },\r
    "adjustmentsFunction21": {\r
        "message": "偏航 CD/FF 调整"\r
    },\r
    "adjustmentsFunction22": {\r
        "message": "速率配置文件选择"\r
    },\r
    "adjustmentsFunction23": {\r
        "message": "俯仰速率"\r
    },\r
    "adjustmentsFunction24": {\r
        "message": "横滚速率"\r
    },\r
    "adjustmentsFunction25": {\r
        "message": "遥控 Yaw 曲线调整"\r
    },\r
    "adjustmentsFunction26": {\r
        "message": "手动遥控 Expo 调整"\r
    },\r
    "adjustmentsFunction27": {\r
        "message": "手动遥控 Yaw Expo 调整"\r
    },\r
    "adjustmentsFunction28": {\r
        "message": "手动 Pitch & Roll Rate 调整"\r
    },\r
    "adjustmentsFunction29": {\r
        "message": "手动 Roll Rate 调整"\r
    },\r
    "adjustmentsFunction30": {\r
        "message": "手动 Pitch Rate 调整"\r
    },\r
    "adjustmentsFunction31": {\r
        "message": "手动 Yaw Rate 调整"\r
    },\r
    "adjustmentsFunction32": {\r
        "message": "固定翼导航巡航油门调整"\r
    },\r
    "adjustmentsFunction33": {\r
        "message": "固定翼导航俯仰到油门调整"\r
    },\r
    "adjustmentsFunction34": {\r
        "message": "飞控板 Roll 对齐 调整"\r
    },\r
    "adjustmentsFunction35": {\r
        "message": "飞控板 Pitch 对齐 调整"\r
    },\r
    "adjustmentsFunction36": {\r
        "message": "Level P 调整"\r
    },\r
    "adjustmentsFunction37": {\r
        "message": "Level I 调整"\r
    },\r
    "adjustmentsFunction38": {\r
        "message": "Level D 调整"\r
    },\r
    "adjustmentsFunction39": {\r
        "message": "Pos XY P 调整"\r
    },\r
    "adjustmentsFunction40": {\r
        "message": "Pos XY I 调整"\r
    },\r
    "adjustmentsFunction41": {\r
        "message": "Pos XY D 调整"\r
    },\r
    "adjustmentsFunction42": {\r
        "message": "Pos Z P 调整"\r
    },\r
    "adjustmentsFunction43": {\r
        "message": "Pos Z I 调整"\r
    },\r
    "adjustmentsFunction44": {\r
        "message": "Pos Z D 调整"\r
    },\r
    "adjustmentsFunction45": {\r
        "message": "Heading P 调整"\r
    },\r
    "adjustmentsFunction46": {\r
        "message": "Vel XY P 调整"\r
    },\r
    "adjustmentsFunction47": {\r
        "message": "Vel XY I 调整"\r
    },\r
    "adjustmentsFunction48": {\r
        "message": "Vel XY D 调整"\r
    },\r
    "adjustmentsFunction49": {\r
        "message": "Vel Z P 调整"\r
    },\r
    "adjustmentsFunction50": {\r
        "message": "Vel Z I 调整"\r
    },\r
    "adjustmentsFunction51": {\r
        "message": "Vel Z D 调整"\r
    },\r
    "adjustmentsFunction52": {\r
        "message": "FW 最小油门下俯仰角调整"\r
    },\r
    "adjustmentsFunction53": {\r
        "message": "VTX 功率等级 调整"\r
    },\r
    "adjustmentsFunction54": {\r
        "message": "推力 PID 衰减 (TPA) 调整"\r
    },\r
    "adjustmentsFunction55": {\r
        "message": "TPA 起始点 调整"\r
    },\r
    "adjustmentsFunction56": {\r
        "message": "控制平滑 调整"\r
    },\r
    "adjustmentsFunction57": {\r
        "message": "固定翼TPA时间常数"\r
    },\r
    "adjustmentsFunction58": {\r
        "message": "固定翼水平配平"\r
    },\r
    "adjustmentsFunction59": {\r
        "message": "多任务指标调整"\r
    },\r
    "adjustmentsSave": {\r
        "message": "保存"\r
    },\r
    "adjustmentsEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>: 调整"\r
    },\r
    "programmingEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>: Programming"\r
    },\r
    "servosChangeDirection": {\r
        "message": "设置遥控器通道反向来匹配"\r
    },\r
    "servosName": {\r
        "message": "名称"\r
    },\r
    "servosMid": {\r
        "message": "中"\r
    },\r
    "servosMin": {\r
        "message": "小"\r
    },\r
    "servosMax": {\r
        "message": "大"\r
    },\r
    "servosReverse": {\r
        "message": "反向"\r
    },\r
    "servoOutput": {\r
        "message": "输出"\r
    },\r
    "servosRate": {\r
        "message": "速率 (%)"\r
    },\r
    "servosLiveMode": {\r
        "message": "启用实时模式"\r
    },\r
    "servosButtonSave": {\r
        "message": "保存"\r
    },\r
    "servosNormal": {\r
        "message": "正常"\r
    },\r
    "servoEmptyTableInfo": {\r
        "message": "没有配置舵机。转到 Mixer 选项卡添加它们。"\r
    },\r
    "servosEepromSave": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
    "mixerSaved": {\r
        "message": "混控 <span style=\\"color: #37a8db\\">已保存</span>"\r
    },\r
    "mixerWizard": {\r
        "message": "混控使用向导"\r
    },\r
    "mixerWizardInfo": {\r
        "message": "<ol><li>卸掉螺旋桨</li><li>通电，转到输出选项卡测试所有电机</li><li>注意每个电机的位置 (motor #1 - 左上角等)</li><li>填写一下表格</li></ol>"\r
    },\r
    "gpsHead": {\r
        "message": "位置"\r
    },\r
    "gpsStatHead": {\r
        "message": "统计数据"\r
    },\r
    "gpsMapHead": {\r
        "message": "GPS当前位置"\r
    },\r
    "gpsMapMessage1": {\r
        "message": "请检查您的网络连接"\r
    },\r
    "gpsMapMessage2": {\r
        "message": "等待GPS 3D 定位..."\r
    },\r
    "gpsFix": {\r
        "message": "定位类型:"\r
    },\r
    "gpsFix2D": {\r
        "message": "<span class=\\"fix2d\\">2D</span>"\r
    },\r
    "gpsFix3D": {\r
        "message": "<span class=\\"fix3d\\">3D</span>"\r
    },\r
    "gpsFixNone": {\r
        "message": "<span class=\\"fixnone\\">None</span>"\r
    },\r
    "gpsAltitude": {\r
        "message": "高度:"\r
    },\r
    "gpsLat": {\r
        "message": "纬度:"\r
    },\r
    "gpsLon": {\r
        "message": "经度:"\r
    },\r
    "gpsSpeed": {\r
        "message": "速度:"\r
    },\r
    "gpsSats": {\r
        "message": "卫星数:"\r
    },\r
    "gpsDistToHome": {\r
        "message": "离家距离:"\r
    },\r
    "gpsHDOP": {\r
        "message": "水平精度因子:"\r
    },\r
    "gpsTotalMessages": {\r
        "message": "所有信息:"\r
    },\r
    "gpsMessageRate": {\r
        "message": "更新时间:"\r
    },\r
    "gpsErrors": {\r
        "message": "错误:"\r
    },\r
    "gpsTimeouts": {\r
        "message": "超时:"\r
    },\r
    "gpsEPH": {\r
        "message": "水平定位精度:"\r
    },\r
    "gpsEPV": {\r
        "message": "垂直定位精度:"\r
    },\r
    "gpsSignalStr": {\r
        "message": "接收机信号强度"\r
    },\r
    "gpsPort": {\r
        "message": "串行端口"\r
    },\r
    "gpsBaud": {\r
        "message": "波特率"\r
    },\r
    "magnetometerHead": {\r
        "message": "罗盘校准"\r
    },\r
    "magnetometerHelp": {\r
        "message": "调整罗盘的位置，直到在四轴上得到相同的位置。<br/><strong>注意：</strong> 如果你改变了飞控的方向，请相对于飞控位置而不是无人机位置进行调整。 "\r
    },\r
    "magnetometerOrientationPreset": {\r
        "message": "朝向预设 (align_mag),相对于FC方向"\r
    },\r
    "boardInfo": {\r
        "message": "1. 选择飞控对齐<br>(align_board_roll, align_board_pitch, align_board_yaw)"\r
    },\r
    "magnetometerInfo": {\r
        "message": "2. 选择一个预设(align_mag)或创建一个自定义配置使用滑块<br>(align_mag_roll, align_mag_pitch, align_mag_yaw)"\r
    },\r
    "magnetometerElementToShow": {\r
        "message": "显示元素"\r
    },\r
    "magnetometerAxes": {\r
        "message": "XYZ（磁力计轴）"\r
    },\r
    "axisTableTitleAxis": {\r
        "message": "轴"\r
    },\r
    "axisTableTitleValue": {\r
        "message": "数值 [角度]"\r
    },\r
    "configurationSensorMagPreset": {\r
        "message": "方向由以下方式设置：预设（align_mag）"\r
    },\r
    "configurationSensorMagAngles": {\r
        "message": "方向由以下方式设置：角度（align_mag_roll、align_mag_pitch、align_mag_yaw）"\r
    },\r
    "configurationMagnetometerHelp": {\r
        "message": "<strong>注意:</strong> 记得在使用罗盘功能时配置串口(通过端口选项卡)。"\r
    },\r
    "magnetometerStatHead": {\r
        "message": "罗盘统计"\r
    },\r
    "tabMAGNETOMETER": {\r
        "message": "罗盘"\r
    },\r
    "motors": {\r
        "message": "电机"\r
    },\r
    "servos": {\r
        "message": "舵机"\r
    },\r
    "motorsMaster": {\r
        "message": "主控制"\r
    },\r
    "motorsNotice": {\r
        "message": "<strong>电机测试模式注意事项 :</strong><br />移动滑块时会让电机 <strong>转动</strong><br />为了避免受伤请务必在使用此功能之前 <strong style=\\"color: red\\">把所有的螺旋桨都移除</strong><br />"\r
    },\r
    "motorsEnableControl": {\r
        "message": "我已了解风险，螺旋桨已拆除 - 允许电机转动."\r
    },\r
\r
    "sensorsInfo": {\r
        "message": "请注意，设置过高的图形刷新率会缩短尤其是笔记本电脑的电池使用时间。<br />建议只打开你感兴趣的传感器的图形显示并使用合理的刷新率"\r
    },\r
    "sensorsRefresh": {\r
        "message": "刷新："\r
    },\r
    "sensorsScale": {\r
        "message": "比例："\r
    },\r
\r
    "cliInfo": {\r
        "message": "<strong>注意</strong>: 离开CLI界面或点击 断开连接 会<strong>自动</strong>发送 \\"<strong>exit</strong>\\" 命令到飞控板。最新固件将会<span style=\\"color: red\\">重新启动</span>飞控板并且<span style=\\"color: red\\">不会保存</span>你所做的更改，请使用 \\"<strong>save</strong>\\" 命令来保存你的更改！"\r
    },\r
    "cliInputPlaceholder": {\r
        "message": "在这里输入你的命令。按 Tab 可以进行自动填充。"\r
    },\r
    "cliEnter": {\r
        "message": "检测到命令行模式"\r
    },\r
    "cliReboot": {\r
        "message": "检测到命令行重启"\r
    },\r
    "cliDocsBtn": {\r
        "message": "CLI命令文档"\r
    },\r
    "cliSaveToFileBtn": {\r
        "message": "保存到文件"\r
    },\r
    "cliSaveToFileFailed": {\r
        "message": "无法保存CLI输出到文件中"\r
    },\r
    "cliSaveToFileAborted": {\r
        "message": "将CLI输出保存到文件失败"\r
    },\r
    "cliSaveToFileCompleted": {\r
        "message": "CLI输出成功保存到文件"\r
    },\r
    "cliClearOutputHistoryBtn": {\r
        "message": "清除输出历史记录"\r
    },\r
    "cliCopyToClipboardBtn": {\r
        "message": "复制到剪贴板"\r
    },\r
    "cliExitBtn": {\r
        "message": "退出"\r
    },\r
    "cliSaveSettingsBtn": {\r
        "message": "保存设置"\r
    },\r
    "cliMscBtn": {\r
        "message": "MSC"\r
    },\r
    "cliDiffAllBtn": {\r
        "message": "Diff All"\r
    },\r
    "cliCommandsHelp": {\r
        "message": "在左侧的框中键入或粘贴命令。您可以使用向上和向下箭头键来回想以前输入的命令。输入“help”或点击此图标以获取更多信息。"\r
    },\r
    "cliCopySuccessful": {\r
        "message": "复制成功！"\r
    },\r
    "cliLoadFromFileBtn": {\r
        "message": "从文件加载"\r
    },\r
    "cliConfirmSnippetDialogTitle": {\r
        "message": "查看已加载的命令"\r
    },\r
    "cliConfirmSnippetNote": {\r
        "message": "<strong>注意</strong>: 您可以在执行前查看和编辑命令。"\r
    },\r
    "cliConfirmSnippetBtn": {\r
        "message": "执行"\r
    },\r
\r
    "loggingNote": {\r
        "message": "数据<span style=\\"color: red\\">仅会</span>在此页面记录,关闭此页面将会 <span style=\\"color: red\\">取消</span> 数据记录，并且应用将会返回<strong>\\"普通配置\\"</strong>状态。<br />你可以选择合适的全局刷新率，飞控出于性能考虑，只会每<strong>1</strong>秒写入一次日志。"\r
    },\r
    "loggingSamplesSaved": {\r
        "message": "采样已保存"\r
    },\r
    "loggingLogSize": {\r
        "message": "记录大小："\r
    },\r
    "loggingButtonLogFile": {\r
        "message": "选择记录文件"\r
    },\r
    "loggingStart": {\r
        "message": "开始记录"\r
    },\r
    "loggingStop": {\r
        "message": "停止记录"\r
    },\r
    "loggingBack": {\r
        "message": "退出记录/断开连接"\r
    },\r
    "loggingErrorNotConnected": {\r
        "message": "请先<strong>连接</strong>"\r
    },\r
    "loggingErrorLogFile": {\r
        "message": "请选择记录文件"\r
    },\r
    "loggingErrorOneProperty": {\r
        "message": "至少需要选择一个数据集来记录"\r
    },\r
    "loggingAutomaticallyRetained": {\r
        "message": "已自动加载上一个记录文件: <strong>$1</strong>"\r
    },\r
    "blackboxNotSupported": {\r
        "message": "飞控固件版本太低，无法打开该页面，或者黑盒功能没有在设置页面打开。"\r
    },\r
    "blackboxConfiguration": {\r
        "message": "黑盒设置"\r
    },\r
    "blackboxButtonSave": {\r
        "message": "保存并重启"\r
    },\r
    "serialLogging": {\r
        "message": "外接串行日志记录设备"\r
    },\r
    "serialLoggingSupportedNote": {\r
        "message": "你可以使用串口外接记录设备来记录日志(例如OpenLog)。需要在串口设置页设置相应的串口。"\r
    },\r
\r
    "onboardLoggingFlashLogger": {\r
        "message": "板载闪存"\r
    },\r
    "OnboardSDCard": {\r
        "message": "板载SD卡"\r
    },\r
    "sdcardNote": {\r
        "message": "飞行数据可以保存到板载SD卡。"\r
    },\r
\r
    "dataflashNote": {\r
        "message": "飞行数据可以保存到板载闪存内。"\r
    },\r
    "dataflashNotPresentNote": {\r
        "message": "你的飞控没有可用的闪存芯片。"\r
    },\r
    "dataflashFirmwareUpgradeRequired": {\r
        "message": "板载闪存需要固件版本 &gt;= 1.8.0。"\r
    },\r
    "dataflashButtonSaveFile": {\r
        "message": "将闪存保存到文件..."\r
    },\r
    "dataflashButtonErase": {\r
        "message": "擦除闪存"\r
    },\r
    "dataflashConfirmEraseTitle": {\r
        "message": "确认擦除闪存"\r
    },\r
    "dataflashConfirmEraseNote": {\r
        "message": "这将会擦除闪存里面保存的所有黑匣子日志。它将耗时20秒左右，确定继续？"\r
    },\r
    "dataflashEraseing": {\r
        "message": "正在擦除，请稍候……"\r
    },\r
    "dataflashSavingTitle": {\r
        "message": "正在保存闪存数据到文件"\r
    },\r
    "dataflashSavingNote": {\r
        "message": "保存闪存数据到文件可能会需要几分钟，请等待。"\r
    },\r
    "dataflashSavingNoteAfter": {\r
        "message": "保存成功，点击 “确认” 继续"\r
    },\r
    "dataflashButtonSaveCancel": {\r
        "message": "取消"\r
    },\r
    "dataflashButtonSaveDismiss": {\r
        "message": "确认"\r
    },\r
    "dataflashButtonEraseConfirm": {\r
        "message": "确认擦除"\r
    },\r
    "dataflashButtonEraseCancel": {\r
        "message": "取消"\r
    },\r
    "dataflashFileWriteFailed": {\r
        "message": "无法写入所选文件，该文件夹的权限是否正确?"\r
    },\r
\r
    "firmwareFlasherReleaseSummaryHead": {\r
        "message": "发布信息"\r
    },\r
    "firmwareFlasherReleaseName": {\r
        "message": "名称/版本:"\r
    },\r
    "firmwareFlasherReleaseVersionUrl": {\r
        "message": "访问发布信息页面"\r
    },\r
    "firmwareFlasherReleaseNotes": {\r
        "message": "发布说明："\r
    },\r
    "firmwareFlasherReleaseDate": {\r
        "message": "日期："\r
    },\r
    "firmwareFlasherReleaseStatus": {\r
        "message": "状态："\r
    },\r
    "firmwareFlasherReleaseTarget": {\r
        "message": "飞控目标："\r
    },\r
    "firmwareFlasherReleaseFile": {\r
        "message": "二进制文件："\r
    },\r
    "firmwareFlasherReleaseStatusReleaseCandidate": {\r
        "message": "<span style=\\"color: red\\">重要提示:此固件版本目前被标记为发布候选版本。</span>"\r
    },\r
    "firmwareFlasherReleaseFileUrl": {\r
        "message": "手动下载"\r
    },\r
    "firmwareFlasherTargetWarning": {\r
        "message": "<span style=\\"color: red\\">重要</span>: 请选择飞控对应的固件，如果烧写错误的固件将会导致 <span style=\\"color: red\\">糟糕</span> 的事发生."\r
    },\r
\r
    "firmwareFlasherPath": {\r
        "message": "路径："\r
    },\r
    "firmwareFlasherSize": {\r
        "message": "大小："\r
    },\r
    "firmwareFlasherStatus": {\r
        "message": "状态："\r
    },\r
    "firmwareFlasherProgress": {\r
        "message": "进度："\r
    },\r
    "firmwareFlasherLoadFirmwareFile": {\r
        "message": "请载入固件文件"\r
    },\r
    "firmwareFlasherNoReboot": {\r
        "message": "无重启序列"\r
    },\r
    "firmwareFlasherOnlineSelectBoardDescription": {\r
        "message": "选择您的飞控板以便查看线上固件 - 选择适合您的飞控板固件。请注意<strong>自动选择目标</strong>仅适用于INAV 5.0及更高版本。"\r
    },\r
    "firmwareFlasherOnlineSelectFirmwareVersionDescription": {\r
        "message": "选择您的飞控板固件版本。<br />注意:即使你可以使用这个配置器刷写不同版本的固件。在设置飞控时，您应该匹配固件和配置器的主版本号和次版本号。"\r
    },\r
    "firmwareFlasherNoRebootDescription": {\r
        "message": "如果通电时已经将 BootLoader 脚位短路，或者已按下飞控板上的 Boot 键，请开启此选项"\r
    },\r
    "firmwareFlasherFlashOnConnect": {\r
        "message": "当飞控连接时自动烧录固件"\r
    },\r
    "firmwareFlasherFlashOnConnectDescription": {\r
        "message": "当发现新的串口设备时尝试自动烧录固件"\r
    },\r
    "firmwareFlasherFullChipErase": {\r
        "message": "清空所有资料"\r
    },\r
    "firmwareFlasherFullChipEraseDescription": {\r
        "message": "清空目前所有在飞控板上的配置资料"\r
    },\r
    "firmwareFlasherFlashDevelopmentFirmware": {\r
        "message": "使用测试版固件"\r
    },\r
    "firmwareFlasherFlashDevelopmentFirmwareDescription": {\r
        "message": "烧录最新（没有经过测试）的固件"\r
    },\r
    "firmwareFlasherManualBaud": {\r
        "message": "手动波特率"\r
    },\r
    "firmwareFlasherManualBaudDescription": {\r
        "message": "当飞控板不支持默认的波特率或者通过蓝牙连接时，请手动选择波特率。<br /><span style=\\"color: red\\">注意:</span> 当通过 USB DFU 模式烧写时不要打开此开关"\r
    },\r
    "firmwareFlasherShowDevelopmentReleases": {\r
        "message": "显示不稳定的版本"\r
    },\r
    "firmwareFlasherShowDevelopmentReleasesDescription": {\r
        "message": "显示版本 - 候选和开发版本"\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmware": {\r
        "message": "选择固件/飞控板"\r
    },\r
    "firmwareFlasherOptionLabelSelectBoard": {\r
        "message": "选择飞控板"\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmwareVersion": {\r
        "message": "选择固件版本"\r
    },\r
    "firmwareFlasherOptionLabelSelectFirmwareVersionFor": {\r
        "message": "选择固件版本"\r
    },\r
    "firmwareFlasherButtonAutoSelect": {\r
        "message": "自动选择固件目标"\r
    },\r
    "firmwareFlasherButtonLoadLocal": {\r
        "message": "从本地电脑加载固件"\r
    },\r
    "firmwareFlasherButtonLoadOnline": {\r
        "message": "从网络加载固件"\r
    },\r
    "firmwareFlasherButtonLoading": {\r
        "message": "加载中"\r
    },\r
    "firmwareFlasherFlashFirmware": {\r
        "message": "烧写固件"\r
    },\r
    "firmwareFlasherGithubInfoHead": {\r
        "message": "GitHub 固件信息"\r
    },\r
    "firmwareFlasherCommiter": {\r
        "message": "提交者："\r
    },\r
    "firmwareFlasherDate": {\r
        "message": "日期："\r
    },\r
    "firmwareFlasherHash": {\r
        "message": "哈希值:"\r
    },\r
    "firmwareFlasherUrl": {\r
        "message": "打开 GitHub 查看该提交…"\r
    },\r
    "firmwareFlasherMessage": {\r
        "message": "信息："\r
    },\r
    "firmwareFlasherWarningHead": {\r
        "message": "警告"\r
    },\r
    "firmwareFlasherWarningText": {\r
        "message": "<span style=\\"color: red\\">不要</span> 尝试把固件烧写到不适用 INAV 的硬件上.<br /><span style=\\"color: red\\">不要</span> 在烧写时断开飞控板的连接或是关闭您的电脑.<br /><br /><strong>注意: </strong>STM32 BootLoader 固化在芯片内，它不会被覆写(也就是说，不管怎么搞都不会变砖，只要操作正确，都可以救回来)<br /><!--strong>注意: </strong>烧写固件时 <span style=\\"color: red\\">自动连接</span> 功能会关闭<br /--><strong>注意: </strong>确认您已做好备份，烧写固件时可能会清空您先前的配置<br /><strong>注意:</strong> 如果烧写有问题时，请先尝试断开和飞控的连接，尝试重启、更新 Chrome、更新驱动程序<br /><strong>注意:</strong> 当直接通过 USB 烧写时(Matek H743-SLIM, Holybro Kakute, etc)，请确保您已阅读 iNav 文档中有关于 USB 烧写的部分，并且确认已安装正确的软件和驱动程序"\r
    },\r
    "firmwareFlasherRecoveryHead": {\r
        "message": "<strong> 恢复/丢失通信 </strong>"\r
    },\r
    "firmwareFlasherRecoveryText": {\r
        "message": "如果您和飞控板失去通信，请依照以下步骤恢复通信 :: <ul><li>关闭电源</li><li>开启选项 : 无重启序列 & 清空所有资料</li><li>将 Boot 脚位短路或是按住 Boot 键</li><li>开启电源(如果正确的话，LED 指示灯不会闪烁)</li><li>如果有需要请安装 STM32 驱动程序以及 Zadig 软件(在 iNav 文档中参阅<a href=\\"https://github.com/iNavFlight/inav/blob/master/docs/USB%20Flashing.md\\"target=\\"_blank\\">USB刷写</a> 的部分)</li><li>关闭 iNav Configurator，关闭所有 Chrome，关闭所有 Chrome 外挂程序，重新启动 iNav Configurator</li><li>松开 Boot 键，如果您的飞控板有Boot键的话</li><li>烧写正确的固件(手动选择波特率，如果您的飞控手册有指定)</li><li>关闭电源</li><li>移除 Boot 短路脚位</li><li>开启电源(LED 指示灯应该会闪烁)</li><li>正常连线</li></ul>"\r
    },\r
    "firmwareFlasherButtonLeave": {\r
        "message": "关闭固件烧写"\r
    },\r
    "firmwareFlasherFirmwareNotLoaded": {\r
        "message": "没有加载固件"\r
    },\r
    "firmwareFlasherHexCorrupted": {\r
        "message": "已加载本地固件: ($ 1 字节)"\r
    },\r
    "firmwareFlasherRemoteFirmwareLoaded": {\r
        "message": "<span style=\\"color: #37a8db\\">在线固件已加载，准备刷写</span>"\r
    },\r
    "firmwareFlasherFailedToLoadOnlineFirmware": {\r
        "message": "加载在线固件失败"\r
    },\r
\r
    "ledStripHelp": {\r
        "message": "飞控可以控制 LED 灯带上的每一个灯珠的颜色和效果。<br />配置灯珠的位置，连线的顺序，然后按位置将灯带接入。没有设置过接线顺序的灯珠设置不会被保存。<br />在一个颜色上双击可编辑 HSV 值。"\r
    },\r
    "ledStripButtonSave": {\r
        "message": "保存"\r
    },\r
    "ledStripEepromSaved": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已保存</span>: LED"\r
    },\r
    "controlAxisRoll": {\r
        "message": "横滚 [A]"\r
    },\r
    "controlAxisPitch": {\r
        "message": "俯仰 [E]"\r
    },\r
    "controlAxisYaw": {\r
        "message": "偏航 [R]"\r
    },\r
    "controlAxisThrottle": {\r
        "message": "油门 [T]"\r
    },\r
    "controlAxisMotor": {\r
        "message": "电机"\r
    },\r
    "radioChannelShort": {\r
        "message": "CH "\r
    },\r
    "configHelp2": {\r
        "message": "任意旋转飞控板角度，允许侧装/倒装/旋转等。当运行外部传感器时，使用传感器校准(陀螺仪，加速度计, 罗盘)来定义传感器位置，而不依赖于飞控板的方向。 "\r
    },\r
    "failsafeFeaturesHelpOld": {\r
        "message": "失控保护配置已经发生了很大的变化。请使用最新的INAV"\r
    },\r
    "failsafePaneTitleOld": {\r
        "message": "接收机失控保护"\r
    },\r
    "failsafeFeatureItemOld": {\r
        "message": "遥控信号丢失时的失控保护设置"\r
    },\r
    "failsafeThrottleItemOld": {\r
        "message": "失控保护油门"\r
    },\r
    "failsafeFeaturesHelpNew": {\r
        "message": "失控保护有两个阶段。若飞控在任一接收通道收到无效的脉冲长度，或者接收机汇报已失控，或者彻底没有收到接收机信号，飞控将进入<strong>一阶失控保护</strong> 状态。飞控将会在 <span style=\\"color: red\\">所有通道</span> 使用预置通道设置，如果短时间内信号恢复将可退出失控保护状态。若飞机处于 <strong>解锁</strong> 状态，并且一阶失控保护模式持续时间超过了预设的时间，飞控将进入 <span style=\\"color: red\\">二阶失控保护</span>, 状态，所有通道将会保持当前输出。 <br /><strong>注意:</strong> 在飞控进入一阶失控保护之前，如果遥控通道出现无效的脉冲，该通道一样会使用预置通道设置。"\r
    },\r
    "failsafePulsrangeTitle": {\r
        "message": "有效脉冲范围设置"\r
    },\r
    "failsafePulsrangeHelp": {\r
        "message": "脉冲长度小于最小，或者超过最大，都会被认为是无效脉冲。将会触发单个通道的预置设置覆盖，或引起一阶失控保护。"\r
    },\r
    "failsafeRxMinUsecItem": {\r
        "message": "最小持续时间"\r
    },\r
    "failsafeRxMaxUsecItem": {\r
        "message": "最大持续时间"\r
    },\r
    "failsafeChannelFallbackSettingsTitle": {\r
        "message": "预置通道设置"\r
    },\r
    "failsafeChannelFallbackSettingsHelp": {\r
        "message": "当进入一阶失控保护时，这些设置将会应用于单独无效的遥控通道，或者是所有通道。<strong>注意：</strong>数值应是25us的整数倍，小于25us的设置会被上下取整。"\r
    },\r
    "failsafeChannelFallbackSettingsAuto": {\r
        "message": "<strong>自动</strong> 指的是 横滚、俯仰、方向都回中，油门最低。 <strong>保持</strong> 指的是 所有通道保持最后从接收机接收到的有效的数值。"\r
    },\r
    "failsafeChannelFallbackSettingsHold": {\r
        "message": "<strong>保持</strong>指的是 所有通道保持最后接收到的有效的数值。<strong>设置</strong> 指的是 通道使用在这里设定的值。"\r
    },\r
    "failsafeStageTwoSettingsTitle": {\r
        "message": "设置"\r
    },\r
    "failsafeFeatureItem": {\r
        "message": "启用"\r
    },\r
    "failsafeFeatureHelp": {\r
        "message": "<strong>注意:</strong> 二阶失控保护已禁用, 回退设置将 <strong>自动</strong> 代替用户设置的所有飞行通道(滚，俯仰，偏航和油门)。"\r
    },\r
    "failsafeDelayItem": {\r
        "message": "失去信号后等待多久时间触发失控保护 [For deciseconds (ds): 1 = 0.1秒]"\r
    },\r
    "failsafeDelayHelp": {\r
        "message": "第一阶段等待恢复时间"\r
    },\r
    "failsafeThrottleItem": {\r
        "message": "降落时使用的油门数值"\r
    },\r
    "failsafeOffDelayItem": {\r
        "message": "当失控保护时关闭电机的延迟时间 [For deciseconds (ds):1 = 0.1 秒]"\r
    },\r
    "failsafeOffDelayHelp": {\r
        "message": "处于降落模式时直到关闭电机并且飞行器上锁"\r
    },\r
    "failsafeSubTitle1": {\r
        "message": "程序"\r
    },\r
    "failsafeProcedureItemSelect1": {\r
        "message": "降落"\r
    },\r
    "failsafeProcedureItemSelect2": {\r
        "message": "坠毁"\r
    },\r
    "failsafeProcedureItemSelect3": {\r
        "message": "自动返航"\r
    },\r
    "failsafeProcedureItemSelect4": {\r
        "message": "不做处理"\r
    },\r
    "failsafeKillSwitchItem": {\r
        "message": "失控自毁开关 (开启后飞行器将立即上锁)"\r
    },\r
    "failsafeKillSwitchHelp": {\r
        "message": "在 模式 选项卡中设置此失控保护开关，将绕过所设置的失控保护程序（返航，降落），直接上锁电机坠毁 <strong>注意:</strong> 当 失控自毁开关 启动时将无法解锁"\r
    },\r
    "failsafeUseMinimumDistanceItem": {\r
        "message": "当靠近起飞点时使用备用的最小距离失控保护程序"\r
    },\r
    "failsafeUseMinimumDistanceHelp": {\r
        "message": "如果您需要在飞行器靠近起飞点时有备用的失控保护程序则设置此选项，例如飞行器因着陆造成机翼脱落时，或者当飞行器不再需要一般的RTH失控保护程序时"\r
    },\r
    "failsafeMinDistanceItem": {\r
        "message": "失控保护最小距离"\r
    },\r
    "failsafeMinDistanceHelp": {\r
        "message": "距离起飞地点介于0~最小距离之间时会使用备用失护保护程序,例如设置2000(20米)并且飞行器距离起飞地点13米处,此时会使用最小距离失控保护程序,当飞行器距离起飞地点25米处则会使用一般的失控保护程序,如果设置0则一律使用一般的失控保护程序 "\r
    },\r
    "failsafeMinDistanceProcedureItem": {\r
        "message": "最小距离失控保护程序"\r
    },\r
    "failsafeMinDistanceProcedureHelp": {\r
        "message": "当飞行器距离起飞点在最小距离内会使用这个失控保护程序"\r
    },\r
    "mainHelpArmed": {\r
        "message": "电机已解锁"\r
    },\r
    "mainHelpFailsafe": {\r
        "message": "失控保护模式"\r
    },\r
    "mainHelpLink": {\r
        "message": "串行连接状态"\r
    },\r
    "warning": {\r
        "message": "警告"\r
    },\r
    "escProtocol": {\r
        "message": "电调协议"\r
    },\r
    "escRefreshRate": {\r
        "message": "电调速率"\r
    },\r
    "escProtocolHelp": {\r
        "message": "电调所支持的通信协议,如果您知道电调使用的协议时才变更!"\r
    },\r
    "escRefreshRatelHelp": {\r
        "message": "电调所支持的更新速率,如果您知道电调的速率时才变更!"\r
    },\r
    "servoRefreshRate": {\r
        "message": "舵机刷新率"\r
    },\r
    "servoRefreshRatelHelp": {\r
        "message": "舵机所支持的刷新率,如果您知道舵机的参数时才变更,太高的刷新率可能会损坏舵机！"\r
    },\r
    "logPwmOutputDisabled": {\r
        "message": "PWM 输出已禁用. 电机和舵机无法工作，请到 <u>输出</u> 选项卡中开启!"\r
    },\r
    "configurationGyroSyncTitle": {\r
        "message": "与陀螺仪同步循环时间"\r
    },\r
    "configurationGyroLpfTitle": {\r
        "message": "陀螺仪低通滤波器截止频率"\r
    },\r
    "configurationGyroSyncDenominator": {\r
        "message": "陀螺仪 denominator"\r
    },\r
    "yawJumpPreventionLimit": {\r
        "message": "偏航跳跃阈值"\r
    },\r
    "yawJumpPreventionLimitHelp": {\r
        "message": "防止偏航停止和快速的偏航输入导致的偏航跳跃。要禁用，请将其设置为500。如果您的飞行器“打滑”，请调整此值。增加该值可以提高偏航控制能力，但可能会导致弱动力无人机翻滚/俯仰不稳定。降低该值可以使偏航调整更加柔和，但也可能导致无人机无法保持方向。"\r
    },\r
    "yawPLimit": {\r
        "message": "Yaw P限制"\r
    },\r
    "yawPLimitHelp": {\r
        "message": "Yaw P项的限制器。增加此值可以提高偏航控制能力，但可能会导致横滚和俯仰不稳定。"\r
    },\r
    "tabFiltering": {\r
        "message": "滤波"\r
    },\r
    "gyroLpfCutoffFrequency": {\r
        "message": "陀螺仪低通滤波器截止频率"\r
    },\r
    "gyroLpfCutoffFrequencyHelp": {\r
        "message": "软件滤波器，用于消除陀螺仪信号中的机械振动。数值为截止频率（赫兹）。对于更大的机架和更大的螺旋桨，请将其设置为较低的值。过高的值可能会导致电机和电调过热。"\r
    },\r
    "accLpfCutoffFrequency": {\r
        "message": "加速度计低通滤波器截止频率"\r
    },\r
    "yawLpfCutoffFrequency": {\r
        "message": "偏航低通滤波器截止频率"\r
    },\r
    "yawLpfCutoffFrequencyHelp": {\r
        "message": "Yaw P-term 低通滤波截止频率"\r
    },\r
    "rollPitchItermIgnoreRate": {\r
        "message": "Roll/Pitch I-term 忽略率"\r
    },\r
    "rollPitchItermIgnoreRateHelp": {\r
        "message": "在此旋转速率以上，将忽略PID I-term。这可以防止在机动过程中I项积累"\r
    },\r
    "yawItermIgnoreRate": {\r
        "message": "Yaw I-term 忽略率"\r
    },\r
    "yawItermIgnoreRateHelp": {\r
        "message": "在此旋转速率以上，将忽略PID I-term。这可以防止在机动过程中I项积累"\r
    },\r
    "axisAccelerationLimitRollPitch": {\r
        "message": "横滚/俯仰加速度限制"\r
    },\r
    "axisAccelerationLimitRollPitchHelp": {\r
        "message": "飞手允许的最大角加速度。无人机应能够满足此加速度。一般而言，无人机越大，其加速度就越低。"\r
    },\r
    "axisAccelerationLimitYaw": {\r
        "message": "偏航加速度限制"\r
    },\r
    "axisAccelerationLimitYawHelp": {\r
        "message": "飞手允许的最大角加速度。无人机应能够满足此加速度。一般而言，无人机越大，其加速度就越低。"\r
    },\r
    "pidTuningTPAHelp": {\r
        "message": "油门PID衰减系数。PID增益会从油门TPA断点处开始线性降低到最大油门时的TPA因子。"\r
    },\r
    "pidTuningTPABreakPointHelp": {\r
        "message": "当油门位置超过该值时，油门PID减幅开始。"\r
    },\r
    "configurationAsyncMode": {\r
        "message": "异步模式"\r
    },\r
    "configurationGyroFrequencyTitle": {\r
        "message": "陀螺仪任务频率"\r
    },\r
    "configurationAccelerometerFrequencyTitle": {\r
        "message": "加速度计任务频率"\r
    },\r
    "configurationAttitudeFrequencyTitle": {\r
        "message": "姿态任务频率"\r
    },\r
    "configurationGyroLpfHelp": {\r
        "message": "陀螺仪的硬件截止频率。一般情况下，数值越大越好，但是会使飞行器对振动更加敏感。"\r
    },\r
    "configurationAsyncModeHelp": {\r
        "message": "详见固件“Looptime”文档。"\r
    },\r
    "configurationGyroFrequencyHelp": {\r
        "message": "一般情况下，数值越大越好，但是会使飞行器对振动更加敏感。应保持高于“飞控循环时间”频率。最大实用值取决于硬件，如果设置过高，可能会导致飞控板无法正常运行。请注意CPU使用率。"\r
    },\r
    "configurationAccelerometerFrequencyHelp": {\r
        "message": "对于Acro目的，可以将此值从默认值降低。"\r
    },\r
    "configurationAttitudeFrequencyHelp": {\r
        "message": "对于Acro目的，可以将此值从默认值降低。"\r
    },\r
    "configurationLoopTimeHelp": {\r
        "message": "一般情况下，数值越大越好。使用异步陀螺仪时，应保持低于陀螺仪更新频率。最大实用值取决于硬件，如果设置过高，可能会导致飞控板无法正常运行。请注意CPU使用率。"\r
    },\r
    "tabOSD": {\r
        "message": "OSD"\r
    },\r
    "configurationSensors": {\r
        "message": "传感器 & 总线"\r
    },\r
    "sensorAccelerometer": {\r
        "message": "加速度计"\r
    },\r
    "sensorMagnetometer": {\r
        "message": "罗盘"\r
    },\r
    "sensorBarometer": {\r
        "message": "气压计"\r
    },\r
    "sensorPitot": {\r
        "message": "空速计"\r
    },\r
    "sensorRangefinder": {\r
        "message": "测距仪"\r
    },\r
    "sensorOpflow": {\r
        "message": "光流计"\r
    },\r
    "manualEnablingTemplate": {\r
        "message": "要通过CLI开启，请使用 <strong>feature {name}</strong> 命令"\r
    },\r
    "armingFailureReasonTitle": {\r
        "message": "解锁前检查"\r
    },\r
    "BLOCKED_UAV_NOT_LEVEL": {\r
        "message": "飞行器处于水平状态"\r
    },\r
    "BLOCKED_SENSORS_CALIBRATING": {\r
        "message": "即时校准"\r
    },\r
    "BLOCKED_SYSTEM_OVERLOADED": {\r
        "message": "CPU负载"\r
    },\r
    "BLOCKED_NAVIGATION_SAFETY": {\r
        "message": "导航处于安全状态"\r
    },\r
    "BLOCKED_COMPASS_NOT_CALIBRATED": {\r
        "message": "罗盘已校准"\r
    },\r
    "BLOCKED_ACCELEROMETER_NOT_CALIBRATED": {\r
        "message": "加速度计已校准"\r
    },\r
    "BLOCKED_HARDWARE_FAILURE": {\r
        "message": "硬件处于正常状态"\r
    },\r
    "BLOCKED_INVALID_SETTING": {\r
        "message": "设置已验证"\r
    },\r
    "armingCheckPass": {\r
        "message": "<div class=\\"checkspass\\"></div>"\r
    },\r
    "armingCheckFail": {\r
        "message": "<div class=\\"checksfail\\"></div>"\r
    },\r
    "calibrationHead1": {\r
        "message": "加速度计校准"\r
    },\r
    "calibrationHead2": {\r
        "message": "加速度计数值"\r
    },\r
    "calibrationHead3": {\r
        "message": "水平校准"\r
    },\r
    "calibrationHead4": {\r
        "message": "罗盘校准"\r
    },\r
    "calibrationHead5": {\r
        "message": "光流计校准"\r
    },\r
    "OpflowCalText": {\r
        "message": "开始校准后，您有30秒的时间手拿飞机置于在空中，使其向两侧倾斜，但不能有水平移动。请注意，光流计传感器任何时候都需要朝向地面。"\r
    },\r
    "OpflowCalBtn": {\r
        "message": "校准光流计"\r
    },\r
    "accZero": {\r
        "message": "加速度计零值"\r
    },\r
    "accGain": {\r
        "message": "加速度计取值"\r
    },\r
    "NoteCalibration": {\r
        "message": "注意 : 如果陀螺仪以不同的角度安装或安装在飞控下方，请依照图示中陀螺仪指向的步骤进行校准，否则将无法完成校准"\r
    },\r
    "AccBtn": {\r
        "message": "校准加速度计"\r
    },\r
\r
    "stepTitle1": {\r
        "message": "Step 1"\r
    },\r
    "stepTitle2": {\r
        "message": "Step 2"\r
    },\r
    "stepTitle3": {\r
        "message": "Step 3"\r
    },\r
    "stepTitle4": {\r
        "message": "Step 4"\r
    },\r
    "stepTitle5": {\r
        "message": "Step 5"\r
    },\r
    "stepTitle6": {\r
        "message": "Step 6"\r
    },\r
    "MagXText": {\r
        "message": "Zero X"\r
    },\r
    "MagYText": {\r
        "message": "Zero Y"\r
    },\r
    "MagZText": {\r
        "message": "Zero Z"\r
    },\r
    "MagGainXText": {\r
        "message": "Gain X"\r
    },\r
    "MagGainYText": {\r
        "message": "Gain Y"\r
    },\r
    "MagGainZText": {\r
        "message": "Gain Z"\r
    },\r
    "OpflowScaleText": {\r
        "message": "Scale"\r
    },\r
    "AccResetBtn": {\r
        "message": "重置加速度计校准"\r
    },\r
    "MagCalText": {\r
        "message": "开始校准之后，您有 30 秒的时间将飞行器旋转到各个方向(前后左右上下)"\r
    },\r
    "MagBtn": {\r
        "message": "校准罗盘"\r
    },\r
    "LevCalText": {\r
        "message": "请在这里输入一些文字…"\r
    },\r
    "LevBtn": {\r
        "message": "水平校准"\r
    },\r
    "tabMixer": {\r
        "message": "混控"\r
    },\r
    "presetsApplyHeader": {\r
        "message": "警告"\r
    },\r
    "presetApplyDescription": {\r
        "message": "<p style='color: darkred;'>确保在 <strong>混控</strong> 配置之前应用任何预设!</p><p> 默认配置将会覆盖包括混控、滤波、PID以及其他相关设置，但不会更改飞行模式、遥控设置、失控保护以及OSD设置。应用的默认配置 <strong>不应该</strong> 认定为最佳设置，但可作为参考，并且在飞行前应再次确认新的设置值。</p>"\r
    },\r
    "OK": {\r
        "message": "OK"\r
    },\r
    "accCalibrationStartTitle": {\r
        "message": "加速度计校准"\r
    },\r
    "accCalibrationStartBody": {\r
        "message": "将飞控板依照图示摆放，然后按下 <strong>校准</strong> 按键。重复6个方位动作并且尽量在校准过程中保持稳定。"\r
    },\r
    "accCalibrationStopTitle": {\r
        "message": "校准完成"\r
    },\r
    "accCalibrationStopBody": {\r
        "message": "加速度计校准完成，检查数值并保存。"\r
    },\r
    "accCalibrationProcessing": {\r
        "message": "处理中..."\r
    },\r
    "tabProgramming": {\r
        "message": "编程"\r
    },\r
    "tabAdvancedTuning": {\r
        "message": "进阶调整"\r
    },\r
    "advancedTuningSave": {\r
        "message": "保存并重启"\r
    },\r
    "tabAdvancedTuningTitle": {\r
        "message": "进阶调整"\r
    },\r
    "tabAdvancedTuningAirplaneTuningTitle": {\r
        "message": ": 固定翼"\r
    },\r
    "tabAdvancedTuningMultirotorTuningTitle": {\r
        "message": ": 多旋翼"\r
    },\r
    "tabAdvancedTuningGenericTitle": {\r
        "message": "通用设置"\r
    },\r
    "presetApplyHead": {\r
        "message": "适用于以下设置:"\r
    },\r
    "gyroNotchHz1": {\r
        "message": "第一陀螺陷波滤波器频率。"\r
    },\r
    "gyroNotchCutoff1": {\r
        "message": "第一陀螺陷波滤波器截止频率。"\r
    },\r
    "gyroNotchHz2": {\r
        "message": "第二陀螺陷波滤波器频率。"\r
    },\r
    "gyroNotchCutoff2": {\r
        "message": "第二陀螺陷波滤波器截止频率。"\r
    },\r
    "gyroNotchHz1Help": {\r
        "message": "应该调至螺旋桨谐波频率。通常等于<i>[电机频率] * [螺旋桨叶片数]</i><br><br>必须高于截止频率<br><br><i>0</i> 禁用滤波器"\r
    },\r
    "gyroNotchHz2Help": {\r
        "message": "应该调整到电机频率。<br><br>必须高于截止频率且低于第一个陀螺仪减振滤波器频率。<br><br><i>0</i> 禁用滤波器"\r
    },\r
    "gyroNotchCutoff1Help": {\r
        "message": "定义陷波滤波器的带宽。<br><br>必须保持低于陷波滤波器频率。"\r
    },\r
    "gyroNotchCutoff2Help": {\r
        "message": "定义陷波滤波器的带宽。<br><br>必须保持低于陷波滤波器频率。"\r
    },\r
    "dtermNotchHz": {\r
        "message": "D-term 陷波滤波器频率。"\r
    },\r
    "dtermNotchCutoff": {\r
        "message": "D-term 陷波滤波器截止频率。"\r
    },\r
    "dtermNotchHzHelp": {\r
        "message": "应该放置在第一和第二陀螺仪陷波滤波器频率之间<br><br>必须高于截止频率<br><br><i>0</i>禁用滤波器"\r
    },\r
    "dtermNotchCutoffHelp": {\r
        "message": "必须保持在陷波滤波器频率以下。"\r
    },\r
    "multiRotorNavigationConfiguration": {\r
        "message": "多旋翼导航设置"\r
    },\r
    "userControlMode": {\r
        "message": "用户控制模式"\r
    },\r
    "posholdDefaultSpeed": {\r
        "message": "默认导航速度 "\r
    },\r
    "posholdDefaultSpeedHelp": {\r
        "message": "在RTH期间的默认速度，也用于任务航点模式。如果任务航点没有设置导航速度，则为最大速度"\r
    },\r
    "posholdMaxSpeed": {\r
        "message": "最大导航速度"\r
    },\r
    "posholdMaxManualSpeed": {\r
        "message": "最大巡航速度"\r
    },\r
    "posholdMaxManualSpeedHelp": {\r
        "message": "在POSHOLD/CRUISE模式下允许飞行员手动控制的最大水平速度"\r
    },\r
    "posholdMaxClimbRate": {\r
        "message": "最大导航爬升速率"\r
    },\r
    "posholdMaxManualClimbRate": {\r
        "message": "最大定高爬升速率"\r
    },\r
    "posholdMaxBankAngle": {\r
        "message": "多旋翼最大倾斜率"\r
    },\r
    "posholdMaxBankAngleHelp": {\r
        "message": "导航模式下最大俯仰角度。在PID调节选项卡中限制最大横滚角度。"\r
    },\r
    "posholdHoverThrottle": {\r
        "message": "悬停油门"\r
    },\r
    "navmcAltholdThrottle": {\r
        "message": "定高模式的摇杆位置"\r
    },\r
    "mcWpSlowdown": {\r
        "message": "接近航点时减速"\r
    },\r
    "mcWpSlowdownHelp": {\r
        "message": "启用后，切换到下一个航点时，导航引擎会减速。这将优先翻转向前移动。禁用后，导航引擎将继续到下一个航点，并在前进时转弯。"\r
    },\r
    "positionEstimatorConfiguration": {\r
        "message": "位置估计"\r
    },\r
    "w_z_baro_p": {\r
        "message": "垂直位置气压计权重"\r
    },\r
    "w_z_gps_p": {\r
        "message": "垂直位置GPS权重"\r
    },\r
    "w_z_gps_v": {\r
        "message": "垂直速度GPS权重"\r
    },\r
    "w_xy_gps_p": {\r
        "message": "水平位置GPS权重"\r
    },\r
    "w_xy_gps_v": {\r
        "message": "水平速度GPS权重"\r
    },\r
    "positionEstimatorConfigurationDisclaimer": {\r
        "message": "应该非常小心地更改这些值。在大多数情况下，不需要更改它们。仅供高级用户使用!"\r
    },\r
    "gps_min_sats": {\r
        "message": "GPS卫星有效定位最小值"\r
    },\r
    "w_z_baro_p_help": {\r
        "message": "当该值设置为 <strong>0</strong> 时，气压计不参于高度计算"\r
    },\r
    "w_z_gps_p_help": {\r
        "message": "此设置仅在不安装气压计且配置<strong>inav_use_gps_no_baro</strong>时使用。"\r
    },\r
    "wirelessModeSwitch": {\r
        "message": "无线模式"\r
    },\r
    "rthConfiguration": {\r
        "message": "返航设置"\r
    },\r
    "autoLandingSettings": {\r
        "message": "自动降落设置"\r
    },\r
    "minRthDistance": {\r
        "message": "最小返航距离"\r
    },\r
    "minRthDistanceHelp": {\r
        "message": "如果飞行器在这个距离内，它将降落而不是返航"\r
    },\r
    "rthClimbFirst": {\r
        "message": "返航前爬升"\r
    },\r
    "rthClimbFirstHelp": {\r
        "message": "如果设置为 ON 或 飞行器将先爬升到 nav_rth_altitude 高度，然后掉头返航。如果设置为 OFF,飞行器将立马掉头返航并慢慢爬升高度。对于固定翼来说, ON 将使用线性爬升, ON_FW_SPIRAL 则是盘旋上升，爬升速率由 nav_auto_climb_rate a设置，转弯速率由 nav_fw_loiter_radius 设置。 (ON_FW_SPIRAL 是一个固定翼设置，其行为与多旋翼的 ON 相同)"\r
    },\r
    "rthClimbIgnoreEmergency": {\r
        "message": "无论位置传感器是否正常都先执行爬升"\r
    },\r
    "rthAltControlOverride": {\r
        "message": "返航时用 横滚/俯仰 遥杆覆盖RTH高度和爬升设置"\r
    },\r
    "rthAltControlOverrideHELP": {\r
        "message": "开启时,可以在返航时中止爬升，保持俯仰摇杆打满1秒，飞行器便停止爬升，并在当前高度上继续返航。在固定翼上保持横滚向左或右打满1秒，可以取消 “在自返前爬升” 设置，使飞行器立即转向回家。"\r
    },\r
    "rthTailFirst": {\r
        "message": "机尾优先"\r
    },\r
    "rthAllowLanding": {\r
        "message": "返航之后降落"\r
    },\r
    "rthAltControlMode": {\r
        "message": "返航高度模式"\r
    },\r
    "rthAbortThreshold": {\r
        "message": "返航终止阈值"\r
    },\r
    "rthAbortThresholdHelp": {\r
        "message": "返航完整性检查功能将注意到，在返航期间，如果离家的距离增加，并超过该参数定义的阈值，飞行器将不再继续返航，而是进入紧急降落状态。默认为500米，对多旋翼机和固定翼来说这个数值都足够安全。"\r
    },\r
    "fsMissionDelay": {\r
        "message": "失控保护任务延迟"\r
    },\r
    "fsMissionDelayHelp": {\r
        "message": "定义以秒为单位的延迟，如果飞机在航点任务中，INAV必须等待多长时间才能启动失控保护返航。设置为-1完全禁用失控保护 [0-600s]"\r
    },\r
    "drNavigation": {\r
        "message": "航迹推算导航"\r
    },\r
    "drNavigationHelp": {\r
        "message": "允许INAV在短时间GPS中断期间继续导航(航点，返航，巡航，航向保持等)。该功能需要罗盘和空速计在固定翼飞机上启用。"\r
    },\r
    "rthAltitude": {\r
        "message": "返航高度"\r
    },\r
    "rthAltitudeHelp": {\r
        "message": "用于其他, 固定翼和 '最低限度' 的返航高度模式"\r
    },\r
    "rthTrackBack": {\r
        "message": "RTH跟踪返回模式"\r
    },\r
    "rthTrackBackHelp": {\r
        "message": "启用后，飞机将首先沿着最后一条路径向后飞行，然后直接飞回家。固定翼飞行器将飞回路径，爬升而不是下降。RTH Track Back的使用模式。OFF =禁用，ON =正常和失控返航RTH, FS =仅失控保护RTH。"\r
    },\r
    "rthTrackBackDistance": {\r
        "message": "RTH轨迹返回距离"\r
    },\r
    "rthTrackBackDistanceHelp": {\r
        "message": "在返回轨迹时飞行的距离。一旦总飞行距离超过设定的值[m]，则执行正常返航。"\r
    },\r
    "rthSafeHome": {\r
        "message": "安全着陆点模式"\r
    },\r
    "rthSafeHomeHelp": {\r
        "message": "用来控制何时使用安全着陆点。取值包括:OFF、RTH、RTH_FS。有关更多信息，请参阅安全着陆点（Safehome）文档。"\r
    },\r
    "rthSafeHomeDistance": {\r
        "message": "安全着陆点最大距离"\r
    },\r
    "rthSafeHomeDistanceHelp": {\r
        "message": "为了使用安全着陆点，它与解锁起飞位置必须小于这个距离[厘米]。"\r
    },\r
    "navMaxAltitude": {\r
        "message": "最大航行高度"\r
    },\r
    "navMaxAltitudeHelp": {\r
        "message": "适用于所有导航模式(包括高度保持)的最大允许高度(高于Home Point)。0表示禁用限制"\r
    },\r
    "rthHomeAltitudeLabel": {\r
        "message": "返航到家高度"\r
    },\r
    "rthHomeAltitudeHelp": {\r
        "message": "在没有降落条件时使用。 当飞机返航到家时，飞机将盘旋并改变高度为 返航到家高度。 默认值设置为0则禁用此功能。"\r
    },\r
    "rthTwoStage": {\r
        "message": "攀爬第一阶段法"\r
    },\r
    "rthTwoStageHelp": {\r
        "message": "如果“先爬”被启用，则“分阶段返回Home”功能。设置攀登第一阶段高度为0，使用经典的单级RTH。"\r
    },\r
    "rthTwoStageAlt": {\r
        "message": "攀爬第一阶段高度"\r
    },\r
    "rthTwoStageAltHelp": {\r
        "message": "分阶段RTH第一阶段的高度设置。禁用两级RTH [0-65000cm]"\r
    },\r
    "rthUseLinearDescent": {\r
        "message": "使用线性下降法"\r
    },\r
    "rthUseLinearDescentHelp": {\r
        "message": "如果启用，飞行器将在RTH返航任务的回程航线上缓慢下降至RTH返航点的家庭高度。"\r
    },\r
    "rthLinearDescentStart": {\r
        "message": "线性下降起始距离"\r
    },\r
    "rthLinearDescentStartHelp": {\r
        "message": "这是从家的位置开始线性下降的距离。如果设置为0，线性下降将立即开始。"\r
    },\r
    "landMaxAltVspd": {\r
        "message": "一旦到达<strong>Home</strong>位置，飞行器将开始以这个速度下降。"\r
    },\r
    "landMaxAltVspdHelp": {\r
        "message": "返航后，如果开启自动降落，飞行器将开始以该速度下降，直到达到<strong>减速高度</strong>"\r
    },\r
    "landSlowdownMaxAlt": {\r
        "message": "当飞行器下降到<i>此高度</i>时。为了着陆，它会开始减速。"\r
    },\r
    "landSlowdownMaxAltHelp": {\r
        "message": "当飞行器到达这个高度时，它将开始在 <strong>初始降落速度</strong> 和 <strong>最终着陆速度</strong> 之间线性减速 <strong>最终着陆高度</strong>"\r
    },\r
    "landSlowdownMinAlt": {\r
        "message": "当飞行器下降到<i>此高度</i>时，它将减速到着陆速度。"\r
    },\r
    "landMinAltVspd": {\r
        "message": "着陆速度。"\r
    },\r
    "landMinAltVspdHelp": {\r
        "message": "飞行器垂直速度目标将是当飞行器到达 <strong>最终着陆高度</strong> 时， 从 <strong>初始降落速度</strong> 到 <strong>减速高度</strong> 的速度"\r
    },\r
    "emergencyDescentRate": {\r
        "message": "紧急着陆速度"\r
    },\r
    "cruiseThrottle": {\r
        "message": "巡航油门"\r
    },\r
    "cruiseYawRateLabel": {\r
        "message": "巡航时的偏航速率"\r
    },\r
    "cruiseYawRateHelp": {\r
        "message": "2D 和 3D 巡航的转换率"\r
    },\r
    "cruiseManualThrottleLabel": {\r
        "message": "允许手动增加油门"\r
    },\r
    "cruiseManualThrottleHelp": {\r
        "message": "打开后，可以让你在所有导航模式下都能控制自动油门。你不能低于自动油门值，除非电机停止在零油门。"\r
    },\r
    "minThrottle": {\r
        "message": "最小油门"\r
    },\r
    "maxThrottle": {\r
        "message": "最大油门"\r
    },\r
    "maxBankAngle": {\r
        "message": "最大导航倾斜角度"\r
    },\r
    "maxBankAngleHelp": {\r
        "message": "导航模式下最大倾斜角度。在 PID调节 选项卡中限制最大滚转角。"\r
    },\r
    "maxClimbAngle": {\r
        "message": "最大导航爬升角度"\r
    },\r
    "maxClimbAngleHelp": {\r
        "message": "导航模式下的最大爬升角度。在 PID调整 选项卡中限制最大俯仰角。"\r
    },\r
    "navManualClimbRate": {\r
        "message": "最大定高爬升速率"\r
    },\r
    "navManualClimbRateHelp": {\r
        "message": "定高模式下允许的最大爬升/下降速率"\r
    },\r
    "navAutoClimbRate": {\r
        "message": "最大导航爬升速率"\r
    },\r
    "navAutoClimbRateHelp": {\r
        "message": "导航模式下允许的最大爬升/下降速率"\r
    },\r
    "maxDiveAngle": {\r
        "message": "导航模式下的最大最大俯冲角度"\r
    },\r
    "maxDiveAngleHelp": {\r
        "message": "导航模式下的最大俯冲角度。在 PID调整 选项卡中限制最大俯仰角。"\r
    },\r
    "pitchToThrottle": {\r
        "message": "俯仰与油门比率"\r
    },\r
    "pitchToThrottleHelp": {\r
        "message": "在导航模式中，每爬升一次，就会增加这个单位到巡航油门上。 相反地，每一次下降都会从中减去。  "\r
    },\r
    "minThrottleDownPitch": {\r
        "message": "最小油门下降俯仰角"\r
    },\r
    "minThrottleDownPitchHelp": {\r
        "message": "在Angle模式下，当油门处于0时的自动下倾角。在巡航油门和零油门之间逐渐应用。"\r
    },\r
    "pitchToThrottleSmoothing": {\r
        "message": "油门平滑度"\r
    },\r
    "pitchToThrottleSmoothingHelp": {\r
        "message": "自动驾驶仪如何平滑地调整油门水平，以响应俯仰角的变化 [0-9]."\r
    },\r
    "pitchToThrottleThreshold": {\r
        "message": "瞬时油门调节阈值"\r
    },\r
    "pitchToThrottleThresholdHelp": {\r
        "message": "如果俯仰角比滤波值大得多了， 飞控将立即根据俯仰调整油门水平，而不进行平滑。"\r
    },\r
    "loiterRadius": {\r
        "message": "绕圈半径"\r
    },\r
    "loiterDirectionLabel": {\r
        "message": "绕圈方向"\r
    },\r
    "loiterDirectionHelp": {\r
        "message": "此设置允许您选择绕圈方向。选择 YAW 允许您通过偏航摇杆改变绕圈方向。"\r
    },\r
    "controlSmoothness": {\r
        "message": "控制平滑"\r
    },\r
    "controlSmoothnessHelp": {\r
        "message": "自动驾驶仪如何平稳地控制飞机来纠正导航错误 [0-9]."\r
    },\r
    "wpTrackingAccuracy": {\r
        "message": "航点跟踪精度"\r
    },\r
    "wpTrackingAccuracyHelp": {\r
        "message": "飞行器对航点轨迹的精确程度。较低的值意味着较高的精度，但可能导致超调。6是一个很好的起点[0-10]。"\r
    },\r
    "wpTrackingAngle": {\r
        "message": "航点跟踪角度"\r
    },\r
    "wpTrackingAngleHelp": {\r
        "message": "飞行器接近航路点轨道的角度。较低的值使接近更长，而较高的值可能导致超调。60°是一个很好的起点[30-80]。"\r
    },\r
    "powerConfiguration": {\r
        "message": "电池估算设置"\r
    },\r
    "idlePower": {\r
        "message": "怠速功率"\r
    },\r
    "idlePowerHelp": {\r
        "message": "用于估算剩余飞行时间/距离的怠速油门的功率消耗。单位：0.01W "\r
    },\r
    "cruisePower": {\r
        "message": "巡航功率"\r
    },\r
    "cruisePowerHelp": {\r
        "message": "用于估算剩余飞行时间/距离的巡航油门的功率消耗。 单位：0.01W "\r
    },\r
    "cruiseSpeed": {\r
        "message": "巡航速度"\r
    },\r
    "cruiseSpeedHelp": {\r
        "message": "用于估算剩余飞行时间/距离的固定翼飞行速度。单位：cm/s "\r
    },\r
    "rthEnergyMargin": {\r
        "message": "返航所需能量"\r
    },\r
    "rthEnergyMarginHelp": {\r
        "message": "返航到家所需的能量 (电池容量的百分比)。用于计算剩余飞行时间/距离。"\r
    },\r
    "generalNavigationSettings": {\r
        "message": "通用导航设置"\r
    },\r
    "waypointConfiguration": {\r
        "message": "航点飞行设置"\r
    },\r
    "wpLoadBoot": {\r
        "message": "在启动时加载航点"\r
    },\r
    "wpLoadBootHelp": {\r
        "message": "如果启用，EEPROM中的航点任务将在启动后自动加载。"\r
    },\r
    "wpEnforceAlt": {\r
        "message": "在航点加强高度"\r
    },\r
    "wpEnforceAltHelp": {\r
        "message": "确保到达每个航路点的高度后再继续下一个航路点。飞行器将保持位置并爬升/上升至距离航路点高度的设定范围[1-2000cm]。设置为“[0]”表示禁用。固定翼飞行器不应设置在500cm以下。"\r
    },\r
    "waypointRadius": {\r
        "message": "航点半径"\r
    },\r
    "wpRestartMission": {\r
        "message": "重启航点任务"\r
    },\r
    "wpRestartMissionHelp": {\r
        "message": "设置任务中断时航点任务的重启行为。从第一个航点启动，从最后一个活动航点恢复，或每次“航点模式”重新选择“开启”时在“启动”和“恢复”之间切换。SWITCH有效地允许从之前的中间任务路径点恢复一次，之后任务将从第一个路径点重新开始。"\r
    },\r
    "wpTurnSmoothing": {\r
        "message": "航路点转向平滑"\r
    },\r
    "wpTurnSmoothingHelp": {\r
        "message": "通过在航点切换到游荡的回合来平滑WP任务中的回合。当设置为ON时，飞船将在转弯时到达航点。当设置为ON-CUT时，飞船会在路径点内部转弯，而不会真正到达它(切角)。"\r
    },\r
    "navMotorStop": {\r
        "message": "导航电机停止控制"\r
    },\r
    "navMotorStopHelp": {\r
        "message": "当设置为OFF时，如果油门过低，导航系统将不会接管电机的控制(电机将停止)。当设置为OFF_ALWAYS时，即使失控保护被触发，如果油门过低，导航系统也不会接管对电机的控制。当设置为AUTO_ONLY时，导航系统只会在自主导航模式(NAV WP和NAV RTH)中接管油门的控制。当设置为ALL_NAV(默认)时，导航系统将完全接管电机的控制，即使在油门低时也不允许电机停止。该设置仅对与MOTOR_STOP结合使用时控制油门的NAV模式起作用，如果fw_min_throttle_down_pitch设置不正确或固定翼模型在未设置为ALL_NAV时俯仰估计错误，则可能导致失速。"\r
    },\r
    "soarMotorStop": {\r
        "message": "翱翔模式电机停止"\r
    },\r
    "soarMotorStopHelp": {\r
        "message": "启用翱翔模式时停止电机。"\r
    },\r
    "soarPitchDeadband": {\r
        "message": "翱翔模式Pitch Deadband"\r
    },\r
    "soarPitchDeadbandHelp": {\r
        "message": "俯仰角死区时，翱翔模式启用(度)。角度模式在死区内无效，允许俯仰自由浮动，同时翱翔。"\r
    },\r
    "waypointRadiusHelp": {\r
        "message": "设置了触发到达这个航点的范围半径"\r
    },\r
    "waypointSafeDistance": {\r
        "message": "航点安全距离"\r
    },\r
    "waypointSafeDistanceHelp": {\r
        "message": "返航点和第一个航点之间的最大距离。"\r
    },\r
    "fixedWingNavigationConfiguration": {\r
        "message": "固定翼导航设置"\r
    },\r
    "fixedWingLandingConfiguration": {\r
        "message": "固定翼着陆设置"\r
    },\r
    "MissionPlannerOnlyOneLandWp": {\r
        "message": "每个任务只能设置一个LAND航点。"\r
    },\r
    "fwLandApproachLength" : {\r
        "message": "最终进场长度"\r
    },\r
    "fwLandApproachLengthHelp": {\r
        "message": "最终进场的长度，也包括滑行和拦截阶段。这是从安全归航点到最终转弯点的长度。"\r
    },\r
    "fwLandFinalApproachPitch2throttle": {\r
        "message": "最终进场时俯仰到油门比率的修改器"\r
    },\r
    "fwLandFinalApproachPitch2throttleHelp": {\r
        "message": "此值在最终进场期间与\\"俯仰到油门比率\\"值相乘。允许减小速度。"\r
    },\r
    "fwLandGlideAlt" : {\r
        "message": "滑行阶段的初始高度"\r
    },\r
    "fwLandGlideAltHelp" : {\r
        "message": "在此高度（从着陆点的高度测量）引擎关闭，飞机从此处滑行。"\r
    },\r
    "fwLandFlareAlt" : {\r
        "message": "停滞阶段的初始高度"\r
    },\r
    "fwLandFlareAltHelp" : {\r
        "message": "在此高度（从着陆点的高度测量）执行着陆的最后阶段。"\r
    },\r
    "fwLandGlidePitch" : {\r
        "message": "滑行阶段的俯仰值"\r
    },\r
    "fwLandGlidePitchHelp" : {\r
        "message": "在滑行阶段保持此俯仰角。"\r
    },\r
    "fwLandFlarePitch" : {\r
        "message": "停滞阶段的俯仰值"\r
    },\r
    "fwLandFlarePitchHelp" : {\r
        "message": "在停滞阶段保持此俯仰角。"\r
    },\r
    "fwLandMaxTailwind": {\r
        "message": "最大顺风"\r
    },\r
    "fwLandMaxTailwindHelp": {\r
        "message": "当无法进行逆风着陆且风速低于此值时使用（INAV风速测量不准确）。"\r
    },\r
    "osd_unsupported_msg1": {\r
        "message": "你的飞控对OSD命令没有反应。这可能意味着它没有一个集成的OSD。"\r
    },\r
    "osd_unsupported_msg2": {\r
        "message": "注意一些飞行控制器有一个机载 <a href=\\"https://www.youtube.com/watch?v=ikKH_6SQ-Tk\\" target=\\"_blank\\">MinimOSD</a> ,可以刷写和配置 <a href=\\"https://github.com/ShikOfTheRa/scarab-osd/releases/latest\\" target=\\"_blank\\">scarab-osd</a>, 但是MinimOSD不能通过该接口配置。"\r
    },\r
    "osd_elements": {\r
        "message": "元素"\r
    },\r
    "osd_preview_title": {\r
        "message": "预览<span>(拖动以改变位置)</span>"\r
    },\r
    "osd_preview_title_drag": {\r
        "message": ""\r
    },\r
    "osd_video_format": {\r
        "message": "视频制式"\r
    },\r
    "osd_craft_name": {\r
        "message": "飞行器名称"\r
    },\r
    "osd_pilot_name": {\r
        "message": "飞行员名称"\r
    },\r
    "osdElement_PILOT_LOGO_HELP": {\r
        "message": "在OSD上显示您的小型飞行员logo，并指定其位置。这需要使用带有您的飞行员logo的自定义字体。"\r
    },\r
    "osd_use_pilot_logo": {\r
        "message": "使用飞行员logo。"\r
    },\r
    "osd_use_large_pilot_logo_help": {\r
        "message": "用你的大飞行员logo代替INAV logo。这需要使用带有您的飞行员logo的自定义字体。此logo将显示在武装屏幕上。"\r
    },\r
    "osd_units": {\r
        "message": "单位制式"\r
    },\r
    "osd_main_voltage_decimals": {\r
        "message": "电压小数点"\r
    },\r
    "osd_decimals_altitude": {\r
        "message": "高度小数位"\r
    },\r
    "osd_decimals_distance": {\r
        "message": "距离小数位"\r
    },\r
    "osd_mah_precision": {\r
        "message": "mAh 精度"\r
    },\r
    "osd_coordinate_digits": {\r
        "message": "坐标数字"\r
    },\r
    "osd_plus_code_digits": {\r
        "message": "Plus Code数字"\r
    },\r
    "osd_plus_code_short": {\r
        "message": "Plus Code去掉前导数字"\r
    },\r
    "osd_esc_rpm_precision": {\r
        "message": "ESC RPM 精度"\r
    },\r
    "osd_esc_rpm_precision_help": {\r
        "message": "在RPM显示中显示的数字个数。"\r
    },\r
    "osd_crosshairs_style": {\r
        "message": "十字准心样式"\r
    },\r
    "osd_horizon_offset": {\r
        "message": "AHI & HUD偏移"\r
    },\r
    "osd_horizon_offset_help": {\r
        "message": "在OSD中上下移动HUD和AHI，使其与实际地平线保持水平。 AHI可以根据飞行中的相机角度显示高或低。 <span style='color:red;'>注意: </span> 这不适用于像素OSD。 为此，在CLI中使用' osd_ahi_vertical_offset '命令。"\r
    },\r
    "osd_left_sidebar_scroll": {\r
        "message": "左栏滚动"\r
    },\r
    "osd_right_sidebar_scroll": {\r
        "message": "右栏滚动"\r
    },\r
    "osd_crsf_lq_format": {\r
        "message": "Crossfire LQ 格式"\r
    },\r
    "osd_sidebar_scroll_arrows": {\r
        "message": "侧边栏滚动箭头"\r
    },\r
    "osd_home_position_arm_screen": {\r
        "message": "显示回家点在解锁后的屏幕上"\r
    },\r
    "osd_hud_settings": {\r
        "message": "抬头显示设置"\r
    },\r
    "osd_custom_element_settings": {\r
        "message": "自定义OSD元素"\r
    },\r
    "osd_custom_element_settings_HELP": {\r
        "message": "有关如何使用自定义 OSD 元素的详细说明，请点击此处 ?"\r
    },\r
    "osd_custom_element_settings_icons_HELP": {\r
        "message": "您可以通过点击此帮助按钮找到图标编号。"\r
    },\r
    "custom_element": {\r
        "message": "自定义元素"\r
    },\r
    "osd_hud_settings_HELP": {\r
        "message": "此部分允许微调HUD元素的行为。"\r
    },\r
    "osd_hud_radar_disp": {\r
        "message": "屏幕上的雷达元素的最大数量。"\r
    },\r
    "osd_hud_radar_disp_help": {\r
        "message": "用于INAV雷达/编队飞行。设置为0将禁用此功能。"\r
    },\r
\r
    "osd_hud_radar_range_min": {\r
        "message": "最小雷达范围"\r
    },\r
    "osd_hud_radar_range_min_help": {\r
        "message": "小于此范围的飞行器将不会显示在HUD上。"\r
    },\r
\r
    "osd_hud_radar_range_max": {\r
        "message": "最大雷达范围"\r
    },\r
    "osd_hud_radar_range_max_help": {\r
        "message": "大于此范围的飞行器将不会显示在HUD上。"\r
    },\r
\r
\r
    "osd_hud_wp_disp": {\r
        "message": "屏幕上的航点元素的最大数量。"\r
    },\r
    "osd_hud_wp_disp_help": {\r
        "message": "要显示在屏幕上的航点数量。将其设置为0将禁用此功能。"\r
    },\r
    "osd_camera_uptilt": {\r
        "message": "相机仰角"\r
    },\r
    "osd_camera_uptilt_help": {\r
        "message": "设置FPV相机的仰角（以度为单位），正值表示向上，负值表示向下，相对于水平。用于正确显示HUD元素和AHI（启用时）。"\r
    },\r
    "osd_camera_fov_h": {\r
        "message": "相机水平视场"\r
    },\r
    "osd_camera_fov_h_help": {\r
        "message": "相机水平视场，以度为单位。用于计算HUD显示中元素的位置。"\r
    },\r
    "osd_camera_fov_v": {\r
        "message": "相机垂直视场"\r
    },\r
    "osd_camera_fov_v_help": {\r
        "message": "相机垂直视场，以度为单位。用于计算HUD显示中元素的位置。"\r
    },\r
\r
\r
    "osd_alarms": {\r
        "message": "警报"\r
    },\r
    "osdLayoutDefault": {\r
        "message": "默认布局"\r
    },\r
    "osdLayoutAlternative": {\r
        "message": "选择布局 #$1"\r
    },\r
    "osdUnitImperial": {\r
        "message": "英制"\r
    },\r
    "osdUnitMetric": {\r
        "message": "米制"\r
    },\r
    "osdUnitMetricMPH": {\r
        "message": "米制 + 英制"\r
    },\r
    "osdUnitMetricMPHTip": {\r
        "message": "除了速度显示米制单位，其余显示英制单位"\r
    },\r
    "osdUnitUK": {\r
        "message": "UK"\r
    },\r
    "osdUnitUKTip": {\r
        "message": "除了温度显示摄氏度外，使用英制单位。"\r
    },\r
    "osdUnitGA": {\r
        "message": "通用航空"\r
    },\r
    "osdUnitGATip": {\r
        "message": "使用GA标准单位(non-SI):海里，英尺，节，摄氏度。"\r
    },\r
    "osd_rssi_alarm": {\r
        "message": "RSSI (%)"\r
    },\r
    "osdAlarmBATT_CAP": {\r
        "message": "已使用电量"\r
    },\r
    "osdAlarmBATT_CAP_HELP": {\r
        "message": "当总电量大于这个值时，电池使用容量指示器(毫安时)将闪烁。需要电流传感器。0禁用此警报。"\r
    },\r
    "osd_time_alarm": {\r
        "message": "飞行时间 (分钟)"\r
    },\r
    "osd_alt_alarm": {\r
        "message": "高度"\r
    },\r
    "osd_dist_alarm": {\r
        "message": "距离"\r
    },\r
    "osdAlarmDIST_HELP": {\r
        "message": "当距离大于这个值时，离家距离 元素会闪烁。0禁用此警报。"\r
    },\r
    "osd_neg_alt_alarm": {\r
        "message": "负高度"\r
    },\r
    "osdAlarmMAX_NEG_ALTITUDE_HELP": {\r
        "message": "当海拔为负值且其绝对值大于此告警时,海拔指示灯亮。在高空起飞时很有用。0禁用此警报。"\r
    },\r
    "osd_airspeed_min_alarm": {\r
        "message": "最小空速"\r
    },\r
    "osd_airspeed_min_alarm_HELP": {\r
        "message": "当空速低于此阈值时，空速指示灯将闪烁。0禁用此告警。"\r
    },\r
    "osd_airspeed_max_alarm": {\r
        "message": "最大空速"\r
    },\r
    "osd_airspeed_max_alarm_HELP": {\r
        "message": "当空速超过此阈值时，空速指示灯将闪烁。0禁用此告警。"\r
    },\r
    "osd_gforce_alarm": {\r
        "message": "重力"\r
    },\r
    "osdAlarmGFORCE_HELP": {\r
        "message": "当大于这个值时， 重力 元素将开始闪烁"\r
    },\r
    "osd_gforce_axis_alarm_min": {\r
        "message": "最小重力"\r
    },\r
    "osdAlarmGFORCE_AXIS_MIN_HELP": {\r
        "message": "当小于这个值时， 重力 元素将开始闪烁"\r
    },\r
    "osd_gforce_axis_alarm_max": {\r
        "message": "最大重力"\r
    },\r
    "osdAlarmGFORCE_AXIS_MAX_HELP": {\r
        "message": "当大于这个值时， 重力 元素将开始闪烁"\r
    },\r
    "osdAlarmADSB_MAX_DISTANCE_WARNING": {\r
        "message": "显示的 ADSB 飞机距离（米）"\r
    },\r
    "osdAlarmADSB_MAX_DISTANCE_ALERT": {\r
        "message": "ADSB 数据在此距离内闪烁以发出接近警告"\r
    },\r
    "osd_current_alarm": {\r
        "message": "电流 (A)"\r
    },\r
    "osdAlarmCURRENT_HELP": {\r
        "message": "当消耗大于这个值时，当前元素将开始闪烁。0禁用此警报。"\r
    },\r
    "osd_imu_temp_alarm_min": {\r
        "message": "IMU 最低温度"\r
    },\r
    "osd_imu_temp_alarm_max": {\r
        "message": "IMU 最高温度"\r
    },\r
    "osd_baro_temp_alarm_min": {\r
        "message": "baro 最低温度"\r
    },\r
    "osd_baro_temp_alarm_max": {\r
        "message": "baro 最高温度"\r
    },\r
    "osd_esc_temp_alarm_min": {\r
        "message": "ESC 最低温度"\r
    },\r
    "osd_esc_temp_alarm_max": {\r
        "message": "ESC 最高温度"\r
    },\r
    "osd_snr_alarm": {\r
        "message": "CRSF 信噪比警报级别"\r
    },\r
    "osdalarmSNR_HELP": {\r
        "message": "信噪比只显示在这个值以下。0dB(1:1)，表示接收信号等于噪声地板。"\r
    },\r
    "osd_link_quality_alarm": {\r
        "message": "CRSF 连接质量警报"\r
    },\r
    "osdalarmLQ_HELP": {\r
        "message": "对于 Crossfire 使用70%. 对于 Tracer 使用50%."\r
    },\r
    "osd_rssi_dbm_alarm": {\r
        "message": "CRSF RSSI dBm 警报"\r
    },\r
    "osd_adsb_distance_warning": {\r
        "message": "ADSB 距离警告"\r
    },\r
    "osd_adsb_distance_alert": {\r
        "message": "ADSB 距离提醒"\r
    },\r
    "osd_rssi_dbm_alarm_HELP": {\r
        "message": "RSSI指示灯在该值以下闪烁。范围: [-130,0]. 0则禁用此警报。"\r
    },\r
    "osdGroupGeneral": {\r
        "message": "通用"\r
    },\r
    "osdGroupAltitude": {\r
        "message": "高度"\r
    },\r
    "osdGroupTimers": {\r
        "message": "时间"\r
    },\r
    "osdGroupGForce": {\r
        "message": "重力"\r
    },\r
    "osdGroupTemperature": {\r
        "message": "温度"\r
    },\r
    "osdGroupAttitude": {\r
        "message": "姿态"\r
    },\r
    "osdGroupCurrentMeter": {\r
        "message": "电流计"\r
    },\r
    "osdGroupGPS": {\r
        "message": "GPS"\r
    },\r
    "osdGroupPowerLimits": {\r
        "message": "功率限制"\r
    },\r
    "osdGroupPIDs": {\r
        "message": "RC 可调数值"\r
    },\r
    "osdGroupPIDOutputs": {\r
        "message": "PID控制器输出"\r
    },\r
    "osdGroupVTX": {\r
        "message": "VTX"\r
    },\r
    "osdGroupRx": {\r
        "message": "接收机统计"\r
    },\r
    "osdGroupMapsAndRadars": {\r
        "message": "地图和雷达"\r
    },\r
    "osdGroupMapsAndRadars_HELP": {\r
        "message": "地图和雷达允许在它们上面放置额外的元素，只要它们不与预览中可见的任何地图部分重叠。"\r
    },\r
    "osdElement_ONTIME_FLYTIME": {\r
        "message": "启动时间 / 飞行时间"\r
    },\r
    "osdElement_RSSI_VALUE": {\r
        "message": "RSSI信号强度"\r
    },\r
    "osdElement_RSSI_VALUE_HELP": {\r
        "message": "显示从遥控器接收到的信号质量(越高越好)。"\r
    },\r
    "osdElement_MAIN_BATT_VOLTAGE": {\r
        "message": "电池电压"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_VOLTAGE": {\r
        "message": "补偿电池电压"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_VOLTAGE_HELP": {\r
        "message": "计算出电池在无负载时的电压(模拟理想电池)"\r
    },\r
    "osdElement_MESSAGES": {\r
        "message": "系统消息"\r
    },\r
    "osdElement_MESSAGES_HELP": {\r
        "message": "显示不同的系统信息，如警告、硬件故障和当前飞行模式的扩展细节(如AUTOTUNE和AUTOTRIM模式和RTH阶段)。"\r
    },\r
    "osdElement_MAIN_BATT_CELL_VOLTAGE": {\r
        "message": "单片电芯电压"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_CELL_VOLTAGE": {\r
        "message": "单片电芯补偿电压"\r
    },\r
    "osdElement_SAG_COMP_MAIN_BATT_CELL_VOLTAGE_HELP": {\r
        "message": "计算出电池在无负载时的平均电池电压(模拟理想电池)"\r
    },\r
    "osdElement_MAIN_BATT_REMAINING_PERCENTAGE": {\r
        "message": "电池剩余百分比"\r
    },\r
    "osdElement_MAIN_BATT_REMAINING_CAPACITY": {\r
        "message": "电池剩余容量"\r
    },\r
    "osdElement_REMAINING_FLIGHT_TIME_HELP": {\r
        "message": "根据剩余电池能量、平均功率和回家的距离估算飞机返航前的剩余飞行时间(仅固定翼，请阅读文档)"\r
    },\r
    "osdElement_REMAINING_FLIGHT_DISTANCE_HELP": {\r
        "message": "根据剩余电池能量、平均功率和回家的距离估算飞机返航前的剩余飞行距离(仅固定翼，请阅读文档)"\r
    },\r
    "osdElement_MAIN_BATT_CELL_VOLTAGE_HELP": {\r
        "message": "显示主电池的平均电池电压"\r
    },\r
    "osdElement_MAH_DRAWN": {\r
        "message": "电池已消耗毫安数"\r
    },\r
    "osdElement_EFFICIENCY_MAH": {\r
        "message": "效率 mAh/Km"\r
    },\r
    "osdElement_EFFICIENCY_WH": {\r
        "message": "效率 Wh/Km"\r
    },\r
    "osdElement_PLIMIT_REMAINING_BURST_TIME": {\r
        "message": "剩余爆发时间"\r
    },\r
    "osdElement_PLIMIT_ACTIVE_CURRENT_LIMIT": {\r
        "message": "动态电流限制"\r
    },\r
    "osdElement_PLIMIT_ACTIVE_POWER_LIMIT": {\r
        "message": "动态功率限制"\r
    },\r
    "osdElement_THROTTLE_POSITION_HELP": {\r
        "message": "显示飞行模式下的油门杆位置 <i>it</i> 控制油门输出。在导航模式下，显示INAV命令的油门值。"\r
    },\r
    "osdElement_SCALED_THROTTLE_POSITION_HELP": {\r
        "message": "显示飞行模式下的油门杆位置 <i>it</i>控制油门输出。在导航模式下，显示INAV命令的油门值。这个油门值是基于怠速油门值和最大油门值的比例。"\r
    },\r
    "osdElement_GPS_SPEED": {\r
        "message": "地面速度"\r
    },\r
    "osdElement_GPS_SPEED_HELP": {\r
        "message": "显示GPS地面速度。"\r
    },\r
    "osdElement_GPS_MAX_SPEED": {\r
        "message": "GPS最大速度"\r
    },\r
    "osdElement_GPS_MAX_SPEED_HELP": {\r
        "message": "显示最高的GPS地面速度。"\r
    },\r
    "osdElement_MSL_ALTITUDE": {\r
        "message": "平均海平面高度"\r
    },\r
    "osdElement_MSL_ALTITUDE_HELP": {\r
        "message": "平均海平面以上的高度"\r
    },\r
    "osdElement_3D_SPEED": {\r
        "message": "3D 速度"\r
    },\r
    "osdElement_3D_SPEED_HELP": {\r
        "message": "显示考虑水平和垂直速度的三维速度。"\r
    },\r
    "osdElement_3D_MAX_SPEED": {\r
        "message": "3D 最高速度"\r
    },\r
    "osdElement_3D_MAX_SPEED_HELP": {\r
        "message": "显示考虑到水平和垂直速度的最高的3D速度。"\r
    },\r
    "osdElement_AIR_MAX_SPEED": {\r
        "message": "最高空速"\r
    },\r
    "osdElement_AIR_MAX_SPEED_HELP": {\r
        "message": "显示最高空速。"\r
    },\r
    "osdElement_GPS_SATS": {\r
        "message": "GPS 卫星"\r
    },\r
    "osdElement_GPS_SATS_HELP": {\r
        "message": "显示GPS接收器定位的GPS卫星数量。"\r
    },\r
    "osdElement_GPS_HDOP": {\r
        "message": "GPS水平精度（HDOP）"\r
    },\r
    "osdElement_GPS_HDOP_HELP": {\r
        "message": "显示来自GPS的水平精度稀释值，位置越低，GPS定位越准确。"\r
    },\r
    "osdElement_PLUS_CODE": {\r
        "message": "加码(纬度+经度)"\r
    },\r
    "osdElement_PLUS_CODE_HELP": {\r
        "message": "另外，代码在一个可以直接在谷歌地图中输入的值上编码纬度和经度。它提供了与经纬度相同的精度，同时使用更少的屏幕空间。"\r
    },\r
    "osdElement_AZIMUTH": {\r
        "message": "方位"\r
    },\r
    "osdElement_AZIMUTH_HELP": {\r
        "message": "方位角是飞行器相对于原点的方向。这有助于保持飞机在正确的航线上，或保持飞机在固定的定向天线前。"\r
    },\r
    "osdElement_TRIP_DIST": {\r
        "message": "飞行距离"\r
    },\r
    "osdElement_VARIO_HELP": {\r
        "message": "使用向上或向下箭头显示垂直速度。每个箭头代表每秒10cm(~4英寸)。"\r
    },\r
    "osdElement_VERTICAL_SPEED_INDICATOR": {\r
        "message": "垂直速度指示器"\r
    },\r
    "osdElement_VERTICAL_SPEED_INDICATOR_HELP": {\r
        "message": "使用数字显示垂直速度"\r
    },\r
    "osdElement_G_FORCE": {\r
        "message": "g force"\r
    },\r
    "osdElement_G_FORCE_HELP": {\r
        "message": "显示所有轴受到的重力"\r
    },\r
    "osdElement_G_FORCE_X": {\r
        "message": "机架坐标系中的纵向g力值（X轴）"\r
    },\r
    "osdElement_G_FORCE_X_HELP": {\r
        "message": "显示X轴上的g力(纵向)"\r
    },\r
    "osdElement_G_FORCE_Y": {\r
        "message": "机架坐标系中的横向g力值（Y轴）"\r
    },\r
    "osdElement_G_FORCE_Y_HELP": {\r
        "message": "显示Y轴上的g力(横向)"\r
    },\r
    "osdElement_G_FORCE_Z": {\r
        "message": "机架坐标系中的竖直G力（Z轴）"\r
    },\r
    "osdElement_G_FORCE_Z_HELP": {\r
        "message": "显示Z轴上的g力(垂直)"\r
    },\r
    "osdElement_ROLL_PIDS": {\r
        "message": "Roll PIDs"\r
    },\r
    "osdElement_PITCH_PIDS": {\r
        "message": "Pitch PIDs"\r
    },\r
    "osdElement_YAW_PIDS": {\r
        "message": "Yaw PIDs"\r
    },\r
    "osdElement_ONTIME_FLYTIME_HELP": {\r
        "message": "显示尚未解锁时的启动时间以及解锁后的飞行时间"\r
    },\r
    "osdElement_RTC_TIME": {\r
        "message": "当前时间"\r
    },\r
    "osdElement_RTC_TIME_HELP": {\r
        "message": "显示当前时间，从GPS获取或通过遥控设置。"\r
    },\r
    "osdElement_RC_SOURCE": {\r
        "message": "RC 来源"\r
    },\r
    "osdElement_RC_SOURCE_HELP": {\r
        "message": "显示当前RC源，STD或MSP(在使用MSP覆盖时有用)"\r
    },\r
    "osdElement_VTX_POWER": {\r
        "message": "图传功率等级"\r
    },\r
    "osdElement_VTX_POWER_HELP": {\r
        "message": "显示当前的VTX功率级别。当选择相应的RC调整时，闪烁"\r
    },\r
    "osdElement_ESC_RPM": {\r
        "message": "ESC遥测的电机转速（RPM）"\r
    },\r
    "osdElement_GLIDESLOPE": {\r
        "message": "下滑道"\r
    },\r
    "osdElement_GLIDESLOPE_HELP": {\r
        "message": "每单位失去的高度所经过的水平距离"\r
    },\r
    "osdElement_PAN_SERVO_CENTRED": {\r
        "message": "PAN伺服中心(云台舵机角度)"\r
    },\r
    "osdElement_PAN_SERVO_CENTRED_HELP": {\r
        "message": "显示平移伺服是否居中(0)或偏移(箭头)。 检查配置PAN伺服的 <b>osd_pan_servo_</b> 设置。"\r
    },\r
    "osdElement_VTX_CHANNEL": {\r
        "message": "图传频段和频道"\r
    },\r
    "osdElement_VTX_CHANNEL_HELP": {\r
        "message": "显示当前VTX的频带和通道。需要一个带有SmartAudio或Tramp的VTX，或者一个集成在飞行控制器中的VTX。"\r
    },\r
    "osdElement_RSSI_DBM": {\r
        "message": "接收RSSI（dBm）"\r
    },\r
    "osdElement_LQ_UPLINK": {\r
        "message": "RX 连接质量 %"\r
    },\r
    "osdElement_LQ_UPLINK_HELP": {\r
        "message": "如果使用 CRSF，请使用 Crossfire LQ 格式设置选择格式类型。"\r
    },\r
    "osdElement_LQ_DOWNLINK": {\r
        "message": "接收下行链路质量 %"\r
    },\r
    "osdElement_SNR_DB": {\r
        "message": "接收上行链路信噪比 (SNR)，单位 dB"\r
    },\r
    "osdElement_SNR_DB_HELP": {\r
        "message": "仅在信噪比低于警报级别时显示。当 SNR 为 0dB 时，接收信号强度等于噪声底层水平。"\r
    },\r
    "osdElement_TX_POWER_UPLINK": {\r
        "message": "发射功率，单位 mW"\r
    },\r
    "osdElement_OSD_RX_POWER_DOWNLINK": {\r
        "message": "接收功率，单位 mW"\r
    },\r
    "osdElement_MAP_NORTH": {\r
        "message": "地图(上为北)"\r
    },\r
    "osdElement_MAP_TAKEOFF": {\r
        "message": "地图(上是起飞方向)"\r
    },\r
    "osdElement_RADAR": {\r
        "message": "雷达"\r
    },\r
    "osdElement_MAP_SCALE": {\r
        "message": "地图比例尺"\r
    },\r
    "osdElement_MAP_SCALE_HELP": {\r
        "message": "显示地图/雷达比例尺。"\r
    },\r
    "osdElement_MAP_REFERENCE": {\r
        "message": "地图参考方向"\r
    },\r
    "osdElement_MAP_REFERENCE_HELP": {\r
        "message": "当前地图的参考(指向上方的方向)。N代表北，T代表起飞方向。"\r
    },\r
    "osdElement_FORMATION_FLIGHT": {\r
        "message": "Inav 雷达固定"\r
    },\r
    "osdElement_FORMATION_FLIGHT_HELP": {\r
        "message": "来自 Inav 雷达的最近飞机/编队飞行"\r
    },\r
    "osdElement_WIND_SPEED_HORIZONTAL": {\r
        "message": "水平风速"\r
    },\r
    "osdElement_WIND_SPEED_HORIZONTAL_HELP": {\r
        "message": "显示估计水平风速和方向。"\r
    },\r
    "osdElement_WIND_SPEED_VERTICAL": {\r
        "message": "垂直风速"\r
    },\r
    "osdElement_WIND_SPEED_VERTICAL_HELP": {\r
        "message": "显示估算的垂直风速和方向(向上或向下)。"\r
    },\r
    "osdElement_ACTIVE_PROFILE": {\r
        "message": "显示活动文件"\r
    },\r
    "osdElement_LEVEL_PIDS": {\r
        "message": "Level PIDs"\r
    },\r
    "osdElement_POS_XY_PIDS": {\r
        "message": "位置 XY PIDs"\r
    },\r
    "osdElement_POS_Z_PIDS": {\r
        "message": "位置 Z PIDs"\r
    },\r
    "osdElement_VEL_XY_PIDS": {\r
        "message": "速度 XY PIDs"\r
    },\r
    "osdElement_VEL_Z_PIDS": {\r
        "message": "速度 Z PIDs"\r
    },\r
    "osdElement_FW_ALT_PID_OUTPUTS": {\r
        "message": "FW 高度 PID 控制器输出"\r
    },\r
    "osdElement_FW_POS_PID_OUTPUTS": {\r
        "message": "FW 位置 PID 控制器输出"\r
    },\r
    "osdElement_MC_VEL_X_PID_OUTPUTS": {\r
        "message": "MC 速度 X PID 控制器输出"\r
    },\r
    "osdElement_MC_VEL_Y_PID_OUTPUTS": {\r
        "message": "MC 速度 Y PID 控制器输出"\r
    },\r
    "osdElement_MC_VEL_Z_PID_OUTPUTS": {\r
        "message": "MC 速度 Z PID 控制器输出"\r
    },\r
    "osdElement_MC_POS_XYZ_P_OUTPUTS": {\r
        "message": "MC 位置 XYZ P 控制器输出"\r
    },\r
    "osdElement_IMU_TEMPERATURE": {\r
        "message": "IMU温度"\r
    },\r
    "osdElement_IMU_TEMPERATURE_HELP": {\r
        "message": "IMU的温度"\r
    },\r
    "osdElement_BARO_TEMPERATURE": {\r
        "message": "气压计温度"\r
    },\r
    "osdElement_BARO_TEMPERATURE_HELP": {\r
        "message": "气压计温度"\r
    },\r
    "osdElement_ESC_TEMPERATURE": {\r
        "message": "ESC 温度"\r
    },\r
    "osdElement_ESC_TEMPERATURE_HELP": {\r
        "message": "从DSHOT遥测数据读取ESC的温度"\r
    },\r
    "osdGroupSwitchIndicators": {\r
        "message": "开关指示器"\r
    },\r
    "osdElement_SWITCH_INDICATOR_0": {\r
        "message": "开关指示器1"\r
    },\r
    "osdElement_SWITCH_INDICATOR_1": {\r
        "message": "开关指示器2"\r
    },\r
    "osdElement_SWITCH_INDICATOR_2": {\r
        "message": "开关指示器3"\r
    },\r
    "osdElement_SWITCH_INDICATOR_3": {\r
        "message": "开关指示器4"\r
    },\r
    "osd_pan_servo_settings": {\r
        "message": "云台舵机OSD设置"\r
    },\r
    "osd_pan_servo_settings_HELP": {\r
        "message": "此部分启用并配置云台舵机偏移功能。它用于使OSD元素（如家庭箭头和POI）朝向或正确指向正确方向，即使您已经将相机旋转过来。"\r
    },\r
    "osdPanServoIndex": {\r
        "message": "云台舵机输出"\r
    },\r
    "osdPanServoIndex_HELP": {\r
        "message": "将其设置为云台舵机的输出编号；如混合器输出表中所示。例如输出S6。"\r
    },\r
    "osdPanServoRangeDecadegrees": {\r
        "message": "云台舵机的总运动角度"\r
    },\r
    "osdPanServoRangeDecadegrees_HELP": {\r
        "message": "云台舵机的旋转角度。一个具有180度旋转范围的舵机，通常此设置需要设为180。将该数值设为负数可反转旋转方向。"\r
    },\r
    "osdPanServoIndicatorShowDegrees": {\r
        "message": "在云台指示器旁显示偏移度数"\r
    },\r
    "osdPanServoOffcentreWarning": {\r
        "message": "偏离中心的警告"\r
    },\r
    "osdPanServoOffcentreWarning_HELP": {\r
        "message": "云台舵机中心两侧的度数，其中假定相机希望面对前方，但实际不为0。如果在此范围内并且长时间不为0，则云台舵机偏移OSD元素将闪烁。 0意味着警告已禁用。"\r
    },\r
    "osdGroupOSDCustomElements": {\r
        "message": "OSD 自定义元素"\r
    },\r
    "osdGroupGVars": {\r
        "message": "全局变量"\r
    },\r
    "osdElement_GVAR_0": {\r
        "message": "全局变量 0"\r
    },\r
    "osdElement_GVAR_1": {\r
        "message": "全局变量 1"\r
    },\r
    "osdElement_GVAR_2": {\r
        "message": "全局变量 2"\r
    },\r
    "osdElement_GVAR_3": {\r
        "message": "全局变量 3"\r
    },\r
    "osdElement_SENSOR1_TEMPERATURE": {\r
        "message": "温度传感器 1"\r
    },\r
    "osdElement_SENSOR2_TEMPERATURE": {\r
        "message": "温度传感器 2"\r
    },\r
    "osdElement_SENSOR3_TEMPERATURE": {\r
        "message": "温度传感器 3"\r
    },\r
    "osdElement_SENSOR4_TEMPERATURE": {\r
        "message": "温度传感器 4"\r
    },\r
    "osdElement_SENSOR5_TEMPERATURE": {\r
        "message": "温度传感器 5"\r
    },\r
    "osdElement_SENSOR6_TEMPERATURE": {\r
        "message": "温度传感器 6"\r
    },\r
    "osdElement_SENSOR7_TEMPERATURE": {\r
        "message": "温度传感器 7"\r
    },\r
    "osdElement_SENSOR8_TEMPERATURE": {\r
        "message": "温度传感器 8"\r
    },\r
    "osdSettingMainVoltageDecimals": {\r
        "message": "主电压小数点"\r
    },\r
    "osdElement_OSD_RANGEFINDER": {\r
        "message": "测距仪距离"\r
    },\r
    "osdElement_COURSE_NEXT_GEOZONE": {\r
        "message": "前往下一个地理区域的航向"\r
    },\r
    "osdElement_HOR_DIST_TO_NEXT_GEOZONE": {\r
        "message": "到下一个地理区域的水平距离"\r
    },\r
    "osdElement_VERT_DIST_TO_NEXT_GEOZONE": {\r
        "message": "到下一个地理区域的垂直距离"\r
    },\r
    "osdSettingPLUS_CODE_DIGITS_HELP": {\r
        "message": "赤道精度: 10=13.9x13.9m; 11=2.8x3.5m; 12=56x87cm; 13=11x22cm."\r
    },\r
    "osdSettingPLUS_CODE_SHORT_HELP": {\r
        "message": "去除2、4和6前导数字需要分别在~800km、~40km和~2km内的参考位置，才能恢复到原始坐标。"\r
    },\r
    "osdSettingCRSF_LQ_FORMAT_HELP": {\r
        "message": "TYPE1 显示TBS硬件所用的LQ%。TYPE2 显示RF Profile Modes（2=150Hz、1=50Hz、0=4Hz更新频率）和LQ % [0..100%]。Tracer显示RFMode 1 (1=250Hz) 和 LQ % [0..100%]。"\r
    },\r
    "osd_video_show_guides": {\r
        "message": "显示预览指南"\r
    },\r
    "osd_video_HELP": {\r
        "message": "对于高清数字图传:红线显示4:3屏幕;DZero:保持在蓝框内以获得更高的刷新率;AUTO/PAL:绿线为NTSC限制。"\r
    },\r
    "osd_dji_HD_FPV": {\r
        "message": "DJI数字图传系统"\r
    },\r
    "osd_dji_hide_unsupported": {\r
        "message": "隐藏不支持的元素"\r
    },\r
    "osd_dji_ESC_temp": {\r
        "message": "<i>ESC 温度</i>来源"\r
    },\r
    "osd_dji_RSSI_source": {\r
        "message": "<i>RSSI</i> 来源"\r
    },\r
    "osd_dji_GPS_source": {\r
        "message": "<i>GPS 速度</i> 来源"\r
    },\r
    "osd_dji_speed_source": {\r
        "message": "<i>3D 速度</i> 来源"\r
    },\r
    "osd_dji_use_craft_name_elements": {\r
        "message": "使用飞行器名称的消息和其他元素。</span><br/><span class=\\"blue\\">蓝色</span> 元素出现在飞行器名称中。"\r
    },\r
    "osd_dji_adjustments": {\r
        "message": "在 飞行器名称 中显示调整"\r
    },\r
    "osd_dji_cn_alternating_duration": {\r
        "message": "飞行器名称交替持续时间 ( 1/10 sec)"\r
    },\r
    "osd_switch_indicator_settings": {\r
        "message": "开关指示器设置"\r
    },\r
    "osd_switch_indicator_settings_HELP": {\r
        "message": "建议使用自定义 OSD 元素替代开关指示器。它们功能更强大。点击查看示例。"\r
    },\r
    "osd_switch_indicators_align_left": {\r
        "message": "将开关名称对齐到开关的左侧"\r
    },\r
    "osdSwitchInd0": {\r
        "message": "开关1"\r
    },\r
    "osdSwitchInd1": {\r
        "message": "开关2"\r
    },\r
    "osdSwitchInd2": {\r
        "message": "开关3"\r
    },\r
    "osdSwitchInd3": {\r
        "message": "开关4"\r
    },\r
    "osd_font_default": {\r
        "message": "默认"\r
    },\r
    "osd_font_vision": {\r
        "message": "Vision"\r
    },\r
    "osd_font_impact": {\r
        "message": "Impact"\r
    },\r
    "osd_font_impact_mini": {\r
        "message": "Impact mini"\r
    },\r
    "osd_font_clarity": {\r
        "message": "Clarity"\r
    },\r
    "osd_font_clarity_medium": {\r
        "message": "Clarity medium"\r
    },\r
    "osd_font_bold": {\r
        "message": "Bold"\r
    },\r
    "osd_font_large": {\r
        "message": "Large"\r
    },\r
    "osd_font_load_file": {\r
        "message": "打开字体文件"\r
    },\r
    "osd_font_upload": {\r
        "message": "上传字体"\r
    },\r
    "osd_font_manager": {\r
        "message": "字体管理器"\r
    },\r
    "uploadingCharacters": {\r
        "message": "上传中..."\r
    },\r
    "uploadedCharacters": {\r
        "message": "已上传 $1 字符"\r
    },\r
    "portsIdentifier": {\r
        "message": "标识符"\r
    },\r
    "portsConfiguration": {\r
        "message": "数据"\r
    },\r
    "portsTelemetryOut": {\r
        "message": "遥测输出"\r
    },\r
    "portsSerialRx": {\r
        "message": "串行数字接收机"\r
    },\r
    "portColumnSensors": {\r
        "message": "传感器"\r
    },\r
    "portsPeripherals": {\r
        "message": "外设"\r
    },\r
    "appUpdateNotificationHeader": {\r
        "message": "有新的INAV地面站版本可供下载"\r
    },\r
    "appUpdateNotificationDescription": {\r
        "message": "请访问 <a href=\\"https://github.com/iNavFlight/inav-configurator/releases\\" target=\\"_blank\\">网站</a> 阅读发布说明并下载。"\r
    },\r
    "closeUpdateBtn": {\r
        "message": "取消"\r
    },\r
    "downloadUpdatesBtn": {\r
        "message": "下载新的应用"\r
    },\r
    "tabMissionControl": {\r
        "message": "任务控制"\r
    },\r
    "loadMissionButton": {\r
        "message": "从飞控中加载航点"\r
    },\r
    "saveMissionButton": {\r
        "message": "保存航点到飞控中"\r
    },\r
    "loadEepromMissionButton": {\r
        "message": "从EEPROM中加载航点"\r
    },\r
    "saveEepromMissionButton": {\r
        "message": "保存航点到EEPROM"\r
    },\r
    "loadFileMissionButton": {\r
        "message": "载入文件"\r
    },\r
    "saveFileMissionButton": {\r
        "message": "保存文件"\r
    },\r
    "missionSettingsSave": {\r
        "message": "保存"\r
    },\r
    "missionSettingsCancel": {\r
        "message": "取消"\r
    },\r
    "editPointHead": {\r
        "message": "编辑航点"\r
    },\r
    "editPointButtonSave": {\r
        "message": "保存"\r
    },\r
    "editPointButtonRemove": {\r
        "message": "删除"\r
    },\r
    "removeAllPointButtonSave": {\r
        "message": "删除所有航点"\r
    },\r
    "missionTotalInformationHead": {\r
        "message": "全部信息"\r
    },\r
    "missionTotalInfoFilenameLoaded": {\r
        "message": "已加载文件:"\r
    },\r
    "missionTotalInfoDistance": {\r
        "message": "距离 (m):"\r
    },\r
    "missionTotalInfoAvailablePoints": {\r
        "message": "可用航点"\r
    },\r
    "missionTotalInfoMissionValid": {\r
        "message": "有效任务"\r
    },\r
    "missionDefaultPointAlt": {\r
        "message": "高度 (cm): "\r
    },\r
    "missionDefaultPointSpeed": {\r
        "message": "速度 (cm/s): "\r
    },\r
    "missionDefaultSafeRangeSH": {\r
        "message": "半径 (m): "\r
    },\r
    "missionMultiMissionsInfo": {\r
        "message": "任务信息:"\r
    },\r
    "missionMultiActiveMission": {\r
        "message": "活动任务:"\r
    },\r
    "missionMultiMissionNo": {\r
        "message": "任务编号"\r
    },\r
    "missionMultiUpdateAll": {\r
        "message": "更新所有"\r
    },\r
    "missionMultiAddNewMission": {\r
        "message": "增加新任务"\r
    },\r
    "missionEllipsoidEarthDEMModel": {\r
        "message": "使用椭球体代替 SL DEM："\r
    },\r
    "SafehomeLegend": {\r
        "message": "说明 : "\r
    },\r
    "SafehomeMaxDistance": {\r
        "message": "最大距离 (m):"\r
    },\r
    "SafehomeSafeRadius": {\r
        "message": "安全半径 (m):"\r
    },\r
    "SafehomeFwAppraoch": {\r
        "message": "固定翼进场:"\r
    },\r
    "safehomeEdit": {\r
        "message": "编辑安全着陆点"\r
    },\r
    "missionTitleHide": {\r
        "message": "隐藏"\r
    },\r
    "missionTitleCancel": {\r
        "message": "取消"\r
    },\r
    "missionTitleSave": {\r
        "message": "保存"\r
    },\r
    "missionTitlRemove": {\r
        "message": "删除"\r
    },\r
    "missionTitleLoadMissionFile": {\r
        "message": "从文件中加载航点"\r
    },\r
    "missionTitleSaveMissionFile": {\r
        "message": "保存航点到文件"\r
    },\r
    "missionTitleLoadMissionFromFC": {\r
        "message": "从飞控中加载航点"\r
    },\r
    "missionTitleSaveMissionToFC": {\r
        "message": "保存航点到飞控中(断电丢失)"\r
    },\r
    "missionTitleLoadEepromMission": {\r
        "message": "从EEPROM中加载航点"\r
    },\r
    "missionTitleSaveEepromMission": {\r
        "message": "保存航点到EEPROM中(断电不丢失)"\r
    },\r
    "missionTitleDelete": {\r
        "message": "删除"\r
    },\r
    "missionTitleRemoveAll": {\r
        "message": "删除所有"\r
    },\r
    "missionTitleSetActive": {\r
        "message": "设置活动"\r
    },\r
    "missionTitleUpdateAll": {\r
        "message": "更新所有"\r
    },\r
    "missionTitleAdd": {\r
        "message": "增加"\r
    },\r
    "missionTitleMoveToCenterView": {\r
        "message": "移动到视图中心"\r
    },\r
    "missionTitleSaveEepromSafehome": {\r
        "message": "保存安全着陆点到EEPROM"\r
    },\r
    "missionTitleLoadEepromSafehome": {\r
        "message": "从EEPROM中加载安全着陆点"\r
    },\r
    "missionTitlEditMission": {\r
        "message": "编辑任务"\r
    },\r
    "MissionPlannerFwLAndingAltitudeChangeReset": {\r
        "message": "高度低于最小着陆高度。更改已忽略" \r
    },\r
    "missionWpType": {\r
        "message": "类型:"\r
    },\r
    "missionWpLat": {\r
        "message": "纬度:"\r
    },\r
    "missionWpLon": {\r
        "message": "经度:"\r
    },\r
    "missionSeaLevelRef": {\r
        "message": "海拔基准: "\r
    },\r
    "missionElevation": {\r
        "message": "海拔（米）:"\r
    },\r
    "missionNA": {\r
        "message": "N/A"\r
    },\r
    "missionGroundDist": {\r
        "message": "地面距离（米）:"\r
    },\r
    "missionParameter1": {\r
        "message": "参数 1:"\r
    },\r
    "missionParameter2": {\r
        "message": "参数 2:"\r
    },\r
    "missionUserActions": {\r
        "message": "用户操作:"\r
    },\r
    "missionFwLandingSettings": {\r
        "message": "固定翼着陆设置:"\r
    },\r
    "missionFwApproachAlt": {\r
        "message": "进场高度: (厘米):"\r
    },\r
    "missionFwLandAlt": {\r
        "message": "着陆高度: (厘米):"\r
    },\r
    "missionFwApproachDir": {\r
        "message": "进场方向:"\r
    },\r
    "missionFwLandHeading1": {\r
        "message": "航向 1: (度):"\r
    },\r
    "missionFwLandHeading2": {\r
        "message": "航向 2: (度):"\r
    },\r
    "missionExclusive": {\r
        "message": "Excl."\r
    },\r
    "missionRTHsettingsTitle": {\r
        "message": "RTH 设置"\r
    },\r
    "missionDefaultSettingsHead": {\r
        "message": "默认设置"\r
    },\r
    "missionDefaultElevationHead": {\r
        "message": "高度剖面图"\r
    },\r
    "missionHomeHead": {\r
        "message": "计划起飞点"\r
    },\r
    "missionSafehomeHead": {\r
        "message": "安全着陆点管理"\r
    },  \r
    "missionSafehomeAvailableSafehomes" : {\r
        "message": "可用安全着陆点:"\r
    },\r
    "missionSafehomeMaxSafehomesReached": {\r
        "message": "已达到最大安全着陆点数量."\r
    },\r
    "missionGeozoneHead": {\r
        "message": "地理区域"\r
    },\r
    "missionGeozoneEdit": {\r
        "message": "编辑地理区域 $1"\r
    },\r
    "missionGeozoneSaveAndReboot": {\r
        "message": "保存地理区域到EEPROM并重启"\r
    },\r
    "missionGeozoneLoad": {\r
        "message": "从EEPROM加载地理区域"\r
    },\r
    "missionGeozone": {\r
        "message": "-地理区域 "\r
    },\r
    "missionGezoneType": {\r
        "message": "类型"\r
    },\r
    "missionGezoneShape": {\r
        "message": "形状"\r
    },\r
    "missionGeozoneTypePolygon": {\r
        "message": "多边形"\r
    },\r
    "missionGeozoneTypeCircular": {\r
        "message": "圆形"\r
    },\r
    "missionGeozoneMaxZonesReached": {\r
        "message": "已达到地理区域的最大数量。"\r
    },\r
    "missionGeozoneMaxVerticesReached": {\r
        "message": "已达到地理区域的最大顶点数量。"\r
    },\r
    "missionGeozoneWarning": {\r
        "message": "至少已配置一个任务和一个地理区域，请确保任务不违反地理区域设置。"\r
    },\r
    "geozoneEdit": {\r
        "message": "编辑地理区域"\r
    },\r
    "geozoneShape": {\r
        "message": "形状"\r
    },\r
    "geozoneInclusive": {\r
        "message": "包含"\r
    },\r
    "geozoneExcusive": {\r
        "message": "排除"\r
    },\r
    "geozoneMinAlt": {\r
        "message": "最小高度 (厘米)："\r
    },\r
    "geozoneMaxAlt": {\r
        "message": "最大高度 (厘米)："\r
    },\r
    "geozoneInfiniteAlt": {\r
        "message": "0 = 无限高度"\r
    },\r
    "geozoneAction": {\r
        "message": "动作："\r
    },\r
    "geozoneActionNone": {\r
        "message": "无"\r
    },\r
    "geozoneActionAvoid": {\r
        "message": "避让"\r
    },\r
    "geozoneActionPosHold": {\r
        "message": "位置保持"\r
    },\r
    "geozoneActionRTH": {\r
        "message": "返航"\r
    },\r
    "geozoneRadius": {\r
        "message": "半径 (厘米)："\r
    },\r
    "geozoneVerices": {\r
        "message": "顶点："\r
    },\r
    "": {\r
        "message": ""\r
    },\r
    "featureGEOZONE": {\r
        "message": "地理区域"\r
    },\r
    "geozone": {\r
        "message": "地理区域"\r
    },\r
    "featureGEOZONETip": {\r
        "message": "地理区域的虚拟边界（也称为电子围栏），当边界被违反时，会自动触发相应的动作。"\r
    },\r
    "GeozoneSettings": {\r
        "message": "地理区域设置"\r
    },\r
    "geozoneDetectionDistance": {\r
        "message": "检测距离"\r
    },\r
    "geozoneDetectionDistanceHelp": {\r
        "message": "检测地理区域的距离"\r
    },\r
    "geozoneAvoidAltitudeRange": {\r
        "message": "避免高度范围"\r
    },\r
    "geozoneAvoidAltitudeRangeHelp": {\r
        "message": "在此高度范围内，尝试向上避开地理区域"\r
    },\r
    "geozoneSafeAltitudeDistance": {\r
        "message": "安全高度距离"\r
    },\r
    "geozoneSafeAltitudeDistanceHelp": {\r
        "message": "必须保持的垂直距离，以确保不违反区域的上限和下限。"\r
    },\r
    "geozoneSafehomeAsInclusive": {\r
        "message": "安全归家作为包含"\r
    },\r
    "geozoneSafehomeAsInclusiveHelp": {\r
        "message": "将最近的安全归家位置视为包含地理区域"\r
    },\r
    "geozoneSafehomeZoneAction": {\r
        "message": "安全归家区域动作"\r
    },\r
    "geozoneSafehomeZoneActionHelp": {\r
        "message": "安全归家区域的围栏动作"\r
    },\r
    "geozoneMrStopDistance": {\r
        "message": "多旋翼停止距离"\r
    },\r
    "geozoneMrStopDistanceHelp": {\r
        "message": "多旋翼在接近边界前停止的距离"\r
    },\r
    "geozoneNoWayHomeAction": {\r
        "message": "无法归家时的动作"\r
    },\r
    "geozoneNoWayHomeActionHelp": {\r
        "message": "如果在激活地理区域的情况下无法计算返回家的航线时的动作。RTH：返回家并忽略所有地理区域。"\r
    },\r
    "missionGeozoneReboot": {\r
        "message": "是否保存并重启？"\r
    },\r
    "missionGeozoneAvailableZones": {\r
        "message": "可用的地理区域："\r
    },\r
    "missionGeozoneAvailableVertices": {\r
        "message": "可用的顶点："\r
    },\r
    "geozoneInvalidzone": {\r
        "message": "检测到无效的地理区域："\r
    },\r
    "gezoneInvalidReasonNotCC": {\r
        "message": "不是逆时针方向"\r
    },\r
    "gezoneInvalidReasonComplex": {\r
        "message": "复杂"\r
    },\r
    "gezoneInvalidReasonMinMaxAlt": {\r
        "message": "最大高度 <= 最小高度"\r
    },\r
    "geozoneUnableToSave": {\r
        "message": "无法保存地理区域：无效区域"\r
    },\r
    "missionMultiMissionHead": {\r
        "message": "多任务"\r
    },\r
    "missionTemplateHead": {\r
        "message": "任务模板"\r
    },\r
    "missionActionMenuHead": {\r
        "message": "操作菜单"\r
    },\r
    "useOnlyStandalone": {\r
        "message": "使用独立的应用程序。<br> 请访问 <a href=\\"https://github.com/iNavFlight/inav-configurator/releases\\" target=\\"_blank\\">网站</a> 阅读发布说明并下载。"\r
    },\r
    "eeprom_load_ok": {\r
        "message": "EEPROM <span style=\\"color: #37a8db\\">已加载</span>"\r
    },\r
    "confirm_delete_all_points": {\r
        "message": "你确定要删除所有的航点吗?"\r
    },\r
    "confirm_delete_point_with_options": {\r
        "message": "你真的想删除这个航点与 non-Geo JUMP/SET_HEAD/RTH选项?如果是，附加的non-Geo选项也将被删除!"\r
    },\r
    "confirm_multimission_file_load": {\r
        "message": "这是一份多任务文件。加载将重写当前多任务。\\n继续?"\r
    },\r
    "confirm_overwrite_multimission_file_load_option": {\r
        "message": "这将重写当前的多任务航点。\\n继续?"\r
    },\r
    "multimission_active_index_saved_eeprom": {\r
        "message": "航点活动索引已保存"\r
    },\r
    "no_waypoints_to_load": {\r
        "message": "没有航点可以加载！"\r
    },\r
    "no_waypoints_to_save": {\r
        "message": "没有航点可以保存！"\r
    },\r
    "mixerThrottleWarning": {\r
        "message": "警告：数值超出正常操作范围。"\r
    },\r
    "servoMixer": {\r
        "message": "舵机混控"\r
    },\r
    "servoMixerDelete": {\r
        "message": "删除"\r
    },\r
    "servoMixerAdd": {\r
        "message": "新增混控规则"\r
    },\r
    "platformType": {\r
        "message": "平台类型"\r
    },\r
    "platformConfiguration": {\r
        "message": "平台配置"\r
    },\r
    "output_modeTitle": {\r
        "message": "输出模式"\r
    },\r
    "mixerPreset": {\r
        "message": "混合预设"\r
    },\r
    "mixerNotLoaded": {\r
        "message": "混控没有加载.<br />点击 <b>加载并应用</b> 或 <b>加载混控</b> 以使用所选的混控.<br />或点击 <b>刷新混控</b> 以使用当前的混控."\r
    },\r
    "mixerLoadPresetRules": {\r
        "message": "加载混控"\r
    },\r
    "mixerRefreshCurrentRules": {\r
        "message": "刷新混控"\r
    },\r
    "mixerLoadAndApplyPresetRules": {\r
        "message": "加载并应用"\r
    },\r
    "mixerApplyModalTitle": {\r
        "message": "确定"\r
    },\r
    "mixerButtonSaveAndReboot": {\r
        "message": "保存并重启"\r
    },\r
    "mixerApplyDescription": {\r
        "message": "此操作将覆盖所有当前的混控设置，并将其替换为默认值。没有“撤销”选项!"\r
    },\r
    "mixerWizardModalTitle": {\r
        "message": "多旋翼混控向导"\r
    },\r
    "mixerWizardModalApply": {\r
        "message": "应用"\r
    },\r
    "motorWizard0": {\r
        "message": "右后方"\r
    },\r
    "motorWizard1": {\r
        "message": "右前方"\r
    },\r
    "motorWizard2": {\r
        "message": "左后方"\r
    },\r
    "motorWizard3": {\r
        "message": "左前方"\r
    },\r
    "mixerWizardMotorPosition": {\r
        "message": "电机位置"\r
    },\r
    "mixerWizardMotorIndex": {\r
        "message": "电机序号"\r
    },\r
    "settings": {\r
        "message": "设置"\r
    },\r
    "decimals": {\r
        "message": "小数位"\r
    },\r
    "motorMixer": {\r
        "message": "电机混控"\r
    },\r
    "servo": {\r
        "message": "舵机"\r
    },\r
    "input": {\r
        "message": "输入"\r
    },\r
    "fixedValue": {\r
        "message": " 定值 (µs)"\r
    },\r
    "weight": {\r
        "message": "重量 (%)"\r
    },\r
    "speed": {\r
        "message": "速度 (10µs/s)"\r
    },\r
    "mixerPresetTitle": {\r
        "message": "混控向导"\r
    },\r
    "fcFirmwareUpdateRequired": {\r
        "message": "飞控固件必须更新到最新版本才能使用此功能"\r
    },\r
    "mixerNotConfigured": {\r
        "message": "混控没有配置，请到 <u>混控</u> 界面去设置！"\r
    },\r
    "confirm_reset_settings": {\r
        "message": "您真的要重置所有设置吗?\\n注意: 所有设置都会重置了!你必须在这个操作后重新设置整个飞控!"\r
    },\r
    "confirm_select_defaults": {\r
        "message": "这将允许为所有设置选择新的默认值。现有的PID参数和其他设置可能会丢失!要继续吗?"\r
    },\r
    "confirm_reset_pid": {\r
        "message": "这将重置所有PID设置为固件默认值并保存。要继续吗?"\r
    },\r
    "mappingTableOutput": {\r
        "message": "输出"\r
    },\r
    "mappingTableFunction": {\r
        "message": "功能"\r
    },\r
    "mappingTableTitle": {\r
        "message": "输出映射"\r
    },\r
    "NONE": {\r
        "message": "NONE"\r
    },\r
    "DEFAULT": {\r
        "message": "默认"\r
    },\r
    "AIRCRAFT": {\r
        "message": "飞行器"\r
    },\r
    "ALTITUDE": {\r
        "message": "高度"\r
    },\r
    "GROUND_SPEED": {\r
        "message": "地速"\r
    },\r
    "HOME_DISTANCE": {\r
        "message": "离家距离"\r
    },\r
    "brakingSpeedThreshold": {\r
        "message": "最小速度阈值"\r
    },\r
    "brakingSpeedThresholdTip": {\r
        "message": "只有当实际速度高于阈值时，才会启用制动"\r
    },\r
    "brakingDisengageSpeed": {\r
        "message": "制动解除速度"\r
    },\r
    "brakingDisengageSpeedTip": {\r
        "message": "当速度低于这个值时制动将停止"\r
    },\r
    "brakingTimeout": {\r
        "message": "最大制动时间"\r
    },\r
    "brakingTimeoutTip": {\r
        "message": "安全措施。这是制动可以主动进行的最长时间。"\r
    },\r
    "brakingBoostFactor": {\r
        "message": "制动增强系数"\r
    },\r
    "brakingBoostFactorTip": {\r
        "message": "定义了制动增强的强度。100%表示导航引擎的倾斜速度和加速度可以翻倍"\r
    },\r
    "brakingBoostTimeout": {\r
        "message": "制动增强的最大持续时间"\r
    },\r
    "brakingBoostTimeoutTip": {\r
        "message": "安全措施。这是制动增强可以主动进行的最长时间。"\r
    },\r
    "brakingBoostSpeedThreshold": {\r
        "message": "制动增强最小速度阈值"\r
    },\r
    "brakingBoostSpeedThresholdTip": {\r
        "message": "只有实际速度高于阈值时才启用制动增强"\r
    },\r
    "brakingBoostDisengageSpeed": {\r
        "message": "制动增强解除速度"\r
    },\r
    "brakingBoostDisengageSpeedTip": {\r
        "message": "当速度低于这个值时制动增强将停止"\r
    },\r
    "brakingBankAngle": {\r
        "message": "最大倾斜角度"\r
    },\r
    "brakingBankAngleTip": {\r
        "message": "制动阶段允许的最大倾斜角度"\r
    },\r
    "multirotorBrakingConfiguration": {\r
        "message": "多旋翼刹车模式设置"\r
    },\r
    "mapProvider": {\r
        "message": "地图提供商"\r
    },\r
    "proxyURL": {\r
        "message": "地图代理 URL"\r
    },\r
    "proxyLayer": {\r
        "message": "地图代理 Layer"\r
    },\r
    "accNotchHz": {\r
        "message": "加速度计陷波滤波频率"\r
    },\r
    "accNotchHzHelp": {\r
        "message": "允许为加速度计读数设置单个陷波滤波器。如果加速度计记录的噪音尖峰超过了加速度计低通滤波器，则应以与陀螺仪陷波器相同的方式进行配置"\r
    },\r
    "accNotchCutoff": {\r
        "message": "加速度计陷波滤波器截止频率。"\r
    },\r
    "accNotchCutoffHelp": {\r
        "message": "应该保持在加速度计陷波滤波器频率以下。"\r
    },\r
    "gyroStage2LpfCutoffFrequency": {\r
        "message": "第二阶段陀螺仪低通滤波器截止频率。"\r
    },\r
    "gyroStage2LpfCutoffFrequencyHelp": {\r
        "message": "第二阶段陀螺仪低通滤波器是Betaflight非卡尔曼第二阶段滤波器的等效滤波器。必须设置高于第一阶段陀螺仪低通滤波器。对于5英寸和6英寸迷你四轴飞行器，这通常意味着高于150Hz。7英寸四轴以上则需要高于125Hz。"\r
    },\r
    "escProtocolNotAdvised": {\r
        "message": "此ESC协议不建议使用，请自行承担风险"\r
    },\r
    "escProtocolExperimental": {\r
        "message": "实验ESC协议，使用风险自负"\r
    },\r
    "looptimeNotAdvised": {\r
        "message": "在使用GPS的情况下，PID环路可能不稳定"\r
    },\r
    "gyroLpfSuggestedMessage": {\r
        "message": "建议为螺旋桨尺寸低于8英寸的所有多旋翼设置。第一次飞行后一定要检查马达温度"\r
    },\r
    "gyroLpfNotAdvisedMessage": {\r
        "message": "建议选择较高的截止频率"\r
    },\r
    "gyroLpfNotFlyableMessage": {\r
        "message": "这种设置可能会使无人机无法飞行"\r
    },\r
    "gyroLpfWhyNotHigherMessage": {\r
        "message": "如果电机不过热，尝试设置256Hz代替"\r
    },\r
    "gyroLpfWhyNotSlightlyHigherMessage": {\r
        "message": "如果没有振动问题，电机没有过热，尝试设置188Hz代替"\r
    },\r
    "tabLogicConditions": {\r
        "message": "逻辑条件"\r
    },\r
    "logicId": {\r
        "message": "#"\r
    },\r
    "logicEnabled": {\r
        "message": "启用"\r
    },\r
    "logicOperation": {\r
        "message": "操作"\r
    },\r
    "logicOperandA": {\r
        "message": "操作对象 A"\r
    },\r
    "logicOperandB": {\r
        "message": "操作对象 B"\r
    },\r
    "logicFlags": {\r
        "message": "标志"\r
    },\r
    "logicStatus": {\r
        "message": "状态"\r
    },\r
    "logicSave": {\r
        "message": "保存"\r
    },\r
    "logicClose": {\r
        "message": "取消"\r
    },\r
    "logicActivator": {\r
        "message": "激活"\r
    },\r
    "save": {\r
        "message": "保存"\r
    },\r
    "copy": {\r
        "message": "复制"\r
    },\r
    "paste": {\r
        "message": "粘贴"\r
    },\r
    "clear": {\r
        "message": "清除"\r
    },\r
    "active": {\r
        "message": "激活"\r
    },\r
    "itermRelax": {\r
        "message": "Iterm Relax"\r
    },\r
    "itermRelaxHelp": {\r
        "message": "定义Iterm放松算法的激活。PR表示在滚动和俯仰轴上活动，PRY也在偏航上活动。"\r
    },\r
    "dterm_lpf_type": {\r
        "message": "D-term 低通滤波类型"\r
    },\r
    "dterm_lpf_type_help": {\r
        "message": "BIQUAD提供更好的降噪性能，但延迟较高。PT1具有较低的衰减和延迟。"\r
    },\r
    "dterm_lpf2_type": {\r
        "message": "D-term 第二阶段低通滤波类型"\r
    },\r
    "dterm_lpf2_type_help": {\r
        "message": "BIQUAD提供更好的降噪性能，但延迟较高。PT1具有较低的衰减和延迟。"\r
    },\r
    "dterm_lpf2_hz": {\r
        "message": "D-term 第二阶段低通滤波截止频率"\r
    },\r
    "dterm_lpf2_hz_help": {\r
        "message": "ROLL和PITCH轴上的D项低通截止滤波器。0表示禁用过滤器。"\r
    },\r
    "tabFilteringAdvanced": {\r
        "message": "其他滤波器"\r
    },\r
    "gps_map_center": {\r
        "message": "中心点"\r
    },\r
    "ouptputsConfiguration": {\r
        "message": "配置"\r
    },\r
    "vtxDisclaimer": {\r
        "message": "仅在合法的地方使用图传飞行，请始终参考VTX用户手册和当地法规!"\r
    },\r
    "defaultsDialogTitle": {\r
        "message": "默认值"\r
    },\r
    "defaultsDialogInfo": {\r
        "message": "INAV配置器想知道你正在配置哪种类型的无人机。根据这些信息，它将修改一些默认值，以解锁最佳飞行性能"\r
    },\r
    "defaultsDialogInfo2": {\r
        "message": "避免盲目地从以前版本的INAV恢复所有PID和滤波器配置。从默认值返回可以获得最好的结果!"\r
    },\r
    "throttleIdle": {\r
        "message": "油门怠速值 [%]"\r
    },\r
    "throttleIdleDigitalInfo": {\r
        "message": "对于数字电调协议，怠速甚至可以降低到5-7%，而不需要在空中停止电机。如果无人机在降低油门后摆动，可以尝试增加怠速来调整此行为。"\r
    },\r
    "throttleIdleAnalogInfo": {\r
        "message": "对于模拟协议，如果电机正常工作，怠速可以降低到10%以下。如果无人机在降低油门后摆动，试着增加怠速来调整这种行为。"\r
    },\r
    "motor_poles": {\r
        "message": "电机极数 (电机转子上的磁铁数量)"\r
    },\r
    "motorStopWarning": {\r
        "message": "应该在固定翼，车辆和船只上启用。不应该在多旋翼上启用!在多旋翼上，当开启Airmode模式时时，电机在最低油门时也不会停止转动！"\r
    },\r
    "reversibleEscWarning": {\r
        "message": "当开启3D模式时, 电机怠速值应该设置为 0%"\r
    },\r
    "dynamic_gyro_notch_enabled_help": {\r
        "message": "矩阵陀螺滤波器是新一代的动态陀螺陷波滤波器。建议在F4和F7飞行控制器的所有多旋翼上启用它。"\r
    },\r
    "globalFunctions": {\r
        "message": "全局函数"\r
    },\r
    "functionId": {\r
        "message": "#"\r
    },\r
    "functionEnabled": {\r
        "message": "启用"\r
    },\r
    "functionLogicId": {\r
        "message": "激活逻辑条件"\r
    },\r
    "functionAction": {\r
        "message": "动作"\r
    },\r
    "functionOperand": {\r
        "message": "操作对象"\r
    },\r
    "functionFlags": {\r
        "message": "标志"\r
    },\r
    "configurationI2cSpeed": {\r
        "message": "I2C 速度"\r
    },\r
    "configurationI2cSpeedHelp": {\r
        "message": "I2C速度应保持在允许所有连接设备工作的最高水平。默认400kHz是一个安全值，建议在多旋翼下切换到800kHz。"\r
    },\r
    "i2cSpeedSuggested800khz": {\r
        "message": "如果连接的硬件允许，请切换到800kHz"\r
    },\r
    "i2cSpeedTooLow": {\r
        "message": "I2C速度过低!"\r
    },\r
    "configurationVoltageMeterType": {\r
        "message": "电压计选择"\r
    },\r
    "configurationCurrentMeterType": {\r
        "message": "电流计选择"\r
    },\r
    "MissionPlannerJumpSettingsCheck": {\r
        "message": "JUMP 不正确 : 再检查一次! \\n被迫进入 WP 1!"\r
    },\r
    "MissionPlannerJump2SettingsCheck": {\r
        "message": "JUMP 设置不正确:重复次数不应超过10次! \\n检查一遍!被强制重复次数等于0"\r
    },\r
    "MissionPlannerJump3SettingsCheck": {\r
        "message": "JUMP 设置不正确:不能跳转到一个POI!\\n被迫进入 WP 1!"\r
    },\r
    "MissionPlannerHeadSettingsCheck": {\r
        "message": "Heading值不正确:请再次检查!默认情况下被强制为-1!"\r
    },\r
    "MissionPlannerRTHSettingsCheck": {\r
        "message": "RTH选项不正确，应该为0或1。检查一遍! \\n默认强制为0，即RTH之后没有LAND !"\r
    },\r
    "MissionPlannerJumpTargetRemoval": {\r
        "message": "你不能移除一个被定义为 JUMP 目标的航点!你首先需要移除触发跳转的航点上的目标。"\r
    },\r
    "MissionPlannerAltitudeChangeReset": {\r
        "message": "地面以下的高度。忽视改变"\r
    },\r
    "SafehomeSelected": {\r
        "message": ""\r
    },\r
    "SafehomeId": {\r
        "message": "#"\r
    },\r
    "SafehomeEnabled": {\r
        "message": "启用"\r
    },\r
    "SafehomeLon": {\r
        "message": "Lon"\r
    },\r
    "SafehomeLat": {\r
        "message": "Lat"\r
    },\r
    "SafehomeAlt": {\r
        "message": "高度"\r
    },\r
    "WaypointOptionSelected": {\r
        "message": "+"\r
    },\r
    "WaypointOptionId": {\r
        "message": "#"\r
    },\r
    "WaypointOptionAction": {\r
        "message": "类型"\r
    },\r
    "WaypointOptionP1": {\r
        "message": "P1"\r
    },\r
    "WaypointOptionP2": {\r
        "message": "P2"\r
    },\r
    "pidId": {\r
        "message": "#"\r
    },\r
    "pidEnabled": {\r
        "message": "已启动"\r
    },\r
    "pidSetpoint": {\r
        "message": "设定点"\r
    },\r
    "pidMeasurement": {\r
        "message": "测量方式"\r
    },\r
    "pidP": {\r
        "message": "P-gain"\r
    },\r
    "pidI": {\r
        "message": "I-gain"\r
    },\r
    "pidD": {\r
        "message": "D-gain"\r
    },\r
    "pidFF": {\r
        "message": "FF-gain"\r
    },\r
    "pidOutput": {\r
        "message": "输出"\r
    },\r
    "reset": {\r
        "message": "重置"\r
    },\r
    "illegalStateRestartRequired": {\r
        "message": "非法状态。需要重新启动。"\r
    },\r
    "motor_direction_inverted": {\r
        "message": "常规电机转向配置(内转)"\r
    },\r
    "motor_direction_isInverted": {\r
        "message": "反转电机转向配置(外转)"\r
    },\r
    "motor_direction_inverted_hint": {\r
        "message": "在混控功能中反转电机的转向，注意该功能只是改变了程序中电机的逻辑转向，还需要另外更改电机的实际转向。"\r
    },\r
    "mixer_control_profile_linking": {\r
        "message": "PID配置文件将使用与混合配置文件索引相同的索引。"\r
    },\r
    "mixer_control_profile_linking_hint": {\r
        "message": "mixer_control_profile_linking: 如果您希望PID配置文件切换由混合配置文件切换处理，请在两者的混合配置文件上启用此选项（建议在垂直/混合平台类型设置中使用）。"\r
    },\r
    "blackboxFields": {\r
        "message": "黑匣子字段"\r
    },\r
    "BLACKBOX_FEATURE_NAV_ACC": {\r
        "message": "导航加速度计"\r
    },\r
    "BLACKBOX_FEATURE_NAV_POS": {\r
        "message": "导航位置估计"\r
    },\r
    "BLACKBOX_FEATURE_NAV_PID": {\r
        "message": "导航 PID"\r
    },\r
    "BLACKBOX_FEATURE_MAG": {\r
        "message": "罗盘"\r
    },\r
    "BLACKBOX_FEATURE_ACC": {\r
        "message": "加速度计"\r
    },\r
    "BLACKBOX_FEATURE_ATTITUDE": {\r
        "message": "姿态"\r
    },\r
    "BLACKBOX_FEATURE_RC_DATA": {\r
        "message": "遥控数据"\r
    },\r
    "BLACKBOX_FEATURE_RC_COMMAND": {\r
        "message": "遥控指令"\r
    },\r
    "BLACKBOX_FEATURE_MOTORS": {\r
        "message": "电机输出"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_RAW": {\r
        "message": "陀螺仪原始数据（无过滤）"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_ROLL": {\r
        "message": "陀螺仪横滚噪声峰值频率"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_PITCH": {\r
        "message": "陀螺仪俯仰噪声峰值频率"\r
    },\r
    "BLACKBOX_FEATURE_GYRO_PEAKS_YAW": {\r
        "message": "陀螺仪偏航噪声峰值频率"\r
    },\r
    "BLACKBOX_FEATURE_SERVOS": {\r
        "message": "舵机输出"\r
    },\r
    "axisRoll": {\r
        "message": "横滚"\r
    },\r
    "axisPitch": {\r
        "message": "俯仰"\r
    },\r
    "axisYaw": {\r
        "message": "偏航"\r
    },\r
    "showAdvancedPIDs": {\r
        "message": "显示高级PID控制器"\r
    },\r
    "rc_filter_lpf_hz": {\r
        "message": "手动低通滤波 Hz"\r
    },\r
    "rc_filter_smoothing_factor": {\r
        "message": "自动平滑系数"\r
    },\r
    "rc_filter_auto": {\r
        "message": "使用自动RC平滑"\r
    },\r
    "rcSmoothing": {\r
        "message": "RC 平滑"\r
    },\r
    "throttle_scale": {\r
        "message": "油门比例"\r
    },\r
    "throttle_scale_help": {\r
        "message": "允许限制给电机的有效功率。油门比例为1意味着没有功率限制。油门比例0.5意味着电机的功率输出将削减为一半。"\r
    },\r
    "pidTuning_MatrixFilterType": {\r
        "message": "矩阵滤波器类型"\r
    },\r
    "pidTuning_MatrixFilterTypeHelp": {\r
        "message": "定义矩阵滤波器器的类型。默认的2D滤波器器推荐给大多数用户。7英寸或更大的机型可能受益于3D滤波器。"\r
    },\r
    "softSerialWarning": {\r
        "message": "不建议为关键的飞行设备(如GPS或接收机)或高流量设备(如MSP DisplayPort)使用软串口。"\r
    },\r
    "ledStripColorSetupTitle": {\r
        "message": "颜色设置"\r
    },\r
    "ledStripH": {\r
        "message": "H"\r
    },\r
    "ledStripS": {\r
        "message": "S"\r
    },\r
    "ledStripV": {\r
        "message": "V"\r
    },\r
    "ledStripRemainingText": {\r
        "message": "剩余"\r
    },\r
    "ledStripClearSelectedButton": {\r
        "message": "清除已选定"\r
    },\r
    "ledStripClearAllButton": {\r
        "message": "全部清除"\r
    },\r
    "ledStripFunctionSection": {\r
        "message": "LED 功能"\r
    },\r
    "ledStripFunctionTitle": {\r
        "message": "基本功能"\r
    },\r
    "ledStripFunctionNoneOption": {\r
        "message": "无"\r
    },\r
    "ledStripFunctionColorOption": {\r
        "message": "颜色"\r
    },\r
    "ledStripFunctionModesOption": {\r
        "message": "模式和方向"\r
    },\r
    "ledStripFunctionArmOption": {\r
        "message": "锁定状态"\r
    },\r
    "ledStripFunctionBatteryOption": {\r
        "message": "电池"\r
    },\r
    "ledStripFunctionRSSIOption": {\r
        "message": "RSSI"\r
    },\r
    "ledStripFunctionGPSOption": {\r
        "message": "GPS"\r
    },\r
    "ledStripFunctionRingOption": {\r
        "message": "环"\r
    },\r
    "ledStripFunctionChannelOption": {\r
        "message": "通道"\r
    },\r
    "ledStripColorModifierTitle": {\r
        "message": "颜色修改器"\r
    },\r
    "ledStripThrottleText": {\r
        "message": "油门"\r
    },\r
    "ledStripLarsonscannerText": {\r
        "message": "左右扫描"\r
    },\r
    "ledStripBlinkTitle": {\r
        "message": "闪烁"\r
    },\r
    "ledStripBlinkAlwaysOverlay": {\r
        "message": "持续闪烁"\r
    },\r
    "ledStripBlinkLandingOverlay": {\r
        "message": "着陆时闪烁"\r
    },\r
    "ledStripStrobeText": {\r
        "message": "闪光灯"\r
    },\r
    "ledStripEnableStrobeLightEffectText": {\r
        "message": "开启闪光灯效果"\r
    },\r
    "ledStripOverlayTitle": {\r
        "message": "叠加功能"\r
    },\r
    "ledStripWarningsOverlay": {\r
        "message": "警告"\r
    },\r
    "ledStripIndecatorOverlay": {\r
        "message": "指示灯"\r
    },\r
    "colorBlack": {\r
        "message": "黑色"\r
    },\r
    "colorWhite": {\r
        "message": "白色"\r
    },\r
    "colorRed": {\r
        "message": "红色"\r
    },\r
    "colorOrange": {\r
        "message": "橙色"\r
    },\r
    "colorYellow": {\r
        "message": "黄色"\r
    },\r
    "colorLimeGreen": {\r
        "message": "橙绿色"\r
    },\r
    "colorGreen": {\r
        "message": "绿色"\r
    },\r
    "colorMintGreen": {\r
        "message": "薄荷绿"\r
    },\r
    "colorCyan": {\r
        "message": "青色"\r
    },\r
    "colorLightBlue": {\r
        "message": "浅蓝色"\r
    },\r
    "colorBlue": {\r
        "message": "蓝色"\r
    },\r
    "colorDarkViolet": {\r
        "message": "暗紫色"\r
    },\r
    "colorMagenta": {\r
        "message": "品红色"\r
    },\r
    "colorDeepPink": {\r
        "message": "深粉色"\r
    },\r
    "ledStripSelectChannelFromColorList": {\r
        "message": "从颜色列表中选择通道"\r
    },\r
    "ledStripModeColorsTitle": {\r
        "message": "模式颜色"\r
    },\r
    "ledStripModeColorsModeOrientation": {\r
        "message": "方向"\r
    },\r
    "ledStripModeColorsModeHeadfree": {\r
        "message": "无头模式"\r
    },\r
    "ledStripModeColorsModeHorizon": {\r
        "message": "半自稳模式"\r
    },\r
    "ledStripModeColorsModeAngle": {\r
        "message": "自稳模式"\r
    },\r
    "ledStripModeColorsModeMag": {\r
        "message": "磁力计"\r
    },\r
    "ledStripModeColorsModeBaro": {\r
        "message": "气压计"\r
    },\r
\r
    "ledStripDirN": {\r
        "message": "北"\r
    },\r
    "ledStripDirE": {\r
        "message": "东"\r
    },\r
    "ledStripDirS": {\r
        "message": "南"\r
    },\r
    "ledStripDirW": {\r
        "message": "西"\r
    },\r
    "ledStripDirU": {\r
        "message": "上"\r
    },\r
    "ledStripDirD": {\r
        "message": "下"\r
    },\r
    "ledStripModesOrientationTitle": {\r
        "message": "LED 方向和颜色"\r
    },\r
    "ledStripModesSpecialColorsTitle": {\r
        "message": "特殊颜色"\r
    },\r
    "ledStripModeColorsModeDisarmed": {\r
        "message": "已锁定"\r
    },\r
    "ledStripModeColorsModeArmed": {\r
        "message": "已解锁"\r
    },\r
    "ledStripModeColorsModeAnimation": {\r
        "message": "动画"\r
    },\r
    "ledStripModeColorsModeBlinkBg": {\r
        "message": "闪烁背景"\r
    },\r
    "ledStripModeColorsModeGPSNoSats": {\r
        "message": "GPS: 无卫星"\r
    },\r
    "ledStripModeColorsModeGPSNoLock": {\r
        "message": "GPS: 未定位"\r
    },\r
    "ledStripModeColorsModeGPSLocked": {\r
        "message": "GPS: 已定位"\r
    },\r
    "ledStripWiring": {\r
        "message": "LED 灯带布线"\r
    },\r
    "ledStripWiringMode": {\r
        "message": "布线模式"\r
    },\r
    "ledStripWiringClearControl": {\r
        "message": "清除已选定"\r
    },\r
    "ledStripWiringClearAllControl": {\r
        "message": "清除所有布线"\r
    },\r
    "ledStripWiringMessage": {\r
        "message": "没有布线序号的 LED 不会被保存。"\r
    },\r
\r
\r
    "mainLogoText": {\r
        "message": "配置程序版本"\r
    },\r
    "mainLogoTextFirmware": {\r
        "message": "飞控固件版本"\r
    },\r
    "mainPortOverrideLabel": {\r
        "message": "端口: "\r
    },\r
    "mainManual": {\r
        "message": "手动"\r
    },\r
    "sensorDataFlashNotFound": {\r
        "message": "没有找到 <br>黑匣子芯片"\r
    },\r
    "sensorDataFlashFreeSpace": {\r
        "message": "黑匣子：空闲空间"\r
    },\r
    "mixerProfile1": {\r
        "message": "混控配置文件 1"\r
    },\r
    "mixerProfile2": {\r
        "message": "混控配置文件 2"\r
    },\r
    "sensorProfile1": {\r
        "message": "配置文件 1"\r
    },\r
    "sensorProfile2": {\r
        "message": "配置文件 2"\r
    },\r
    "sensorProfile3": {\r
        "message": "配置文件 3"\r
    },\r
    "sensorBatteryProfile1": {\r
        "message": "电池配置文件 1"\r
    },\r
    "sensorBatteryProfile2": {\r
        "message": "电池配置文件 2"\r
    },\r
    "sensorBatteryProfile3": {\r
        "message": "电池配置文件 3"\r
    },\r
    "sensorStatusGyro": {\r
        "message": "陀螺仪"\r
    },\r
    "sensorStatusGyroShort": {\r
        "message": "Gyro",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorStatusAccel": {\r
        "message": "加速度计"\r
    },\r
    "sensorStatusAccelShort": {\r
        "message": "Accel",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorStatusMag": {\r
        "message": "磁力仪"\r
    },\r
    "sensorStatusMagShort": {\r
        "message": "Mag",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorStatusBaro": {\r
        "message": "气压计"\r
    },\r
    "sensorStatusBaroShort": {\r
        "message": "Baro",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorStatusGPS": {\r
        "message": "GPS"\r
    },\r
    "sensorStatusGPSShort": {\r
        "message": "GPS",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorOpticalFlow": {\r
        "message": "光流计"\r
    },\r
    "sensorOpticalFlowShort": {\r
        "message": "Flow"\r
    },\r
    "sensorStatusSonar": {\r
        "message": "声纳/测距仪"\r
    },\r
    "sensorStatusSonarShort": {\r
        "message": "Sonar",\r
        "description": "Text of the image in the top sensors icons. Please keep it short."\r
    },\r
    "sensorAirspeed": {\r
        "message": "空速计"\r
    },\r
    "sensorAirspeedShort": {\r
        "message": "Speed"\r
    },\r
    "sensorBatteryVoltage": {\r
        "message": "电池电压"\r
    },\r
    "mainShowLog": {\r
        "message": "显示日志"\r
    },\r
    "mainHideLog": {\r
        "message": "隐藏日志"\r
    },\r
    "waitingForData": {\r
        "message": "等待数据中…"\r
    },\r
    "outputStatsTableAcc": {\r
        "message": "加速度噪声均方根值 (RMS)"\r
    },\r
    "outputStatsTableCurrent": {\r
        "message": "电流 [A]"\r
    },\r
    "outputStatsTableVoltage": {\r
        "message": "电压 [V]"\r
    },\r
    "LogicConditions": {\r
        "message": "逻辑条件"\r
    },\r
    "PIDControllers": {\r
        "message": "PID控制器"\r
    },\r
    "sensorsGyroSelect": {\r
        "message": "陀螺仪"\r
    },\r
    "sensorsAccelSelect": {\r
        "message": "加速度计"\r
    },\r
    "sensorsMagSelect": {\r
        "message": "罗盘"\r
    },\r
    "sensorsAltitudeSelect": {\r
        "message": "气压计"\r
    },\r
    "sensorsSonarSelect": {\r
        "message": "声纳"\r
    },\r
    "sensorsAirSpeedSelect": {\r
        "message": "空速"\r
    },\r
    "sensorsTemperaturesSelect": {\r
        "message": "温度计"\r
    },\r
\r
    "sensorsDebugSelect": {\r
        "message": "Debug"\r
    },\r
    "sensorsDebugTrace": {\r
        "message": "打开调试跟踪"\r
    },\r
    "sensorsGyroscope": {\r
        "message": "陀螺仪 - deg/s"\r
    },\r
    "sensorsAccelerometer": {\r
        "message": "加速度计 - g"\r
    },\r
    "sensorsMagnetometer": {\r
        "message": "罗盘 - Ga"\r
    },\r
    "sensorsBarometer": {\r
        "message": "气压计 - meters"\r
    },\r
    "sensorsSonar": {\r
        "message": "声纳 - cm"\r
    },\r
    "sensorsAirspeed": {\r
        "message": "空速 - cm/s"\r
    },\r
    "sensorsTemperature0": {\r
        "message": "温度计 0 - °C"\r
    },\r
    "sensorsTemperature1": {\r
        "message": "温度计 1 - °C"\r
    },\r
    "sensorsTemperature2": {\r
        "message": "温度计 2 - °C"\r
    },\r
    "sensorsTemperature3": {\r
        "message": "温度计 3 - °C"\r
    },\r
    "sensorsTemperature4": {\r
        "message": "温度计 4 - °C"\r
    },\r
    "sensorsTemperature5": {\r
        "message": "温度计 5 - °C"\r
    },\r
    "sensorsTemperature6": {\r
        "message": "温度计 6 - °C"\r
    },\r
    "sensorsTemperature7": {\r
        "message": "温度计 7 - °C"\r
    },\r
    "sensorsTemperatureValue": {\r
        "message": "数值:"\r
    },\r
    "getRunningOS": {\r
        "message": "操作系统：<strong>"\r
    },\r
    "getConfiguratorVersion": {\r
        "message": "配置程序版本：<strong>"\r
    },\r
    "loadedReleaseInfo": {\r
        "message": "从GitHub中加载发布信息"\r
    },\r
    "newVersionAvailable": {\r
        "message": "有INAV地面站的新版本!"\r
    },\r
    "ReceiveTime": {\r
        "message": "接收时间: "\r
    },\r
    "SendTime": {\r
        "message": "发送时间: "\r
    },\r
    "ErrorWritingFile": {\r
        "message": "<span style=\\"color: red\\">文件写入错误</span>"\r
    },\r
    "FileSaved": {\r
        "message": "文件已保存"\r
    },\r
    "selectedTarget": {\r
        "message": "选择固件目标 = "\r
    },\r
    "toggledRCs": {\r
        "message": "已切换候选版"\r
    },\r
    "noFirmwareSelectedToLoad": {\r
        "message": "<b>没有选择要加载的固件</b>"\r
    },\r
    "selectValidSerialPort": {\r
        "message": "<span style=\\"color: red\\">请选择有效的串口</span>'"\r
    },\r
    "writePermissionsForFile": {\r
        "message": "您对这个文件没有 <span style=\\"color: red\\">写入权限</span>"\r
    },\r
    "automaticTargetSelect": {\r
        "message": "尝试自动选择目标"\r
    },\r
    "notAWAYPOINT": {\r
        "message": "之前的选择不是一个WAYPOINT!"\r
    },\r
    "startGettingSafehomePoints": {\r
        "message": "开始加载安全着陆点"\r
    },\r
    "endGettingSafehomePoints": {\r
        "message": "加载安全着陆点完成"\r
    },\r
    "startSendingSafehomePoints": {\r
        "message": "开始发送安全着陆点"\r
    },\r
    "endSendingSafehomePoints": {\r
        "message": "发送安全着陆点完成"\r
    },\r
    "startGetPoint": {\r
        "message": "开始加载航点"\r
    },\r
    "startSendPoint": {\r
        "message": "开始发送航点"\r
    },\r
    "errorReadingFileXml2jsNotFound": {\r
        "message": "<span style=\\"color: red\\">读取文件错误(xml2js not found)</span>'"\r
    },\r
    "errorReadingFile": {\r
        "message": "<span style=\\"color: red\\">读取文件错误</span>"\r
    },\r
    "errorParsingFile": {\r
        "message": "<span style=\\"color: red\\">解析文件错误</span>"\r
    },\r
    "loadedSuccessfully": {\r
        "message": "已成功加载!"\r
    },\r
    "errorWritingFileXml2jsNotFound": {\r
        "message": "<span style=\\"color: red\\">写入文件错误 (xml2js not found)</span>"\r
    },\r
    "savedSuccessfully": {\r
        "message": "  已成功保存！"\r
    },\r
    "endGetPoint": {\r
        "message": "加载航点完成"\r
    },\r
    "endSendPoint": {\r
        "message": "发送航点完成"\r
    },\r
    "osdSettingsSaved": {\r
        "message": "OSD设置已保存"\r
    },\r
    "osdLayoutInsertedIntoClipboard": {\r
        "message": "布局已保存到剪贴板"\r
    },\r
    "osdLayoutPasteFromClipboard": {\r
        "message": "布局已从剪贴板恢复"\r
    },\r
    "osdClearLayout": {\r
        "message": "布局已清除"\r
    },\r
    "failedToOpenSerialPort": {\r
        "message": "打开串口<span style=\\"color: red\\">失败</span>"\r
    },\r
    "failedToFlash": {\r
        "message": "烧写<span style=\\"color: red\\">失败</span>"\r
    },\r
    "targetPrefetchsuccessful": {\r
        "message": "目标预载入成功: "\r
    },\r
    "targetPrefetchFail": {\r
        "message": "无法预载入目标: "\r
    },\r
    "targetPrefetchFailDFU": {\r
        "message": "无法预载入目标: 飞控已进入DFU状态"\r
    },\r
    "targetPrefetchFailOld": {\r
        "message": "无法预载入目标: INAV 固件太旧了！"\r
    },\r
    "targetPrefetchFailNonINAV": {\r
        "message": "无法预载入目标: 非INAV固件"\r
    },\r
    "targetPrefetchFailNoPort": {\r
        "message": "无法预载入目标: 没有端口"\r
    },\r
    "timerOutputs": {\r
        "message": "定时器输出"\r
    },\r
    "ezTuneFilterHz": {\r
        "message": "滤波频率"\r
    },\r
    "ezTuneAxisRatio": {\r
        "message": "轴比率(Axis ratio)"\r
    },\r
    "ezTuneResponse": {\r
        "message": "响应"\r
    },\r
    "ezTuneDamping": {\r
        "message": "阻尼(Damping)"\r
    },\r
    "ezTuneStability": {\r
        "message": "稳定性"\r
    },\r
    "ezTuneAggressiveness": {\r
        "message": "侵略性(Aggressiveness)"\r
    },\r
    "ezTuneRate": {\r
        "message": "速率"\r
    },\r
    "ezTuneExpo": {\r
        "message": "曲线"\r
    },\r
    "ezTuneSnappiness": {\r
        "message": "灵敏度"\r
    },\r
    "ezTuneSnappinessTips": {\r
        "message": "帮助实现灵敏的操控感。每当你做快速的摇杆操作时，高灵敏度会加快无人机的反应。无论是开始还是停止操作。尝试不同的数值，找到最适合你的设置。"\r
    },\r
    "ezTuneFilterHzTips": {\r
        "message": "这个设置用于设置所有INAV陀螺仪和D项滤波器的基本截止频率。较高的值会导致更低的滤波延迟和更好的稳定性，但也会使更多的噪音通过滤波器，导致电机过热、无人机可能会出现振荡并无法飞行。您的目标是在出现任何负面影响之前将此值尽可能提高。负面影响包括：电机过热、听得见的振荡、无人机迅速晃动、无人机自行升高。通常的起始点为：<strong>3英寸螺旋桨</strong>：90，<strong>5英寸螺旋桨</strong>：110，<strong>7英寸螺旋桨</strong>：90，<strong>10英寸螺旋桨</strong>：75，<strong>12英寸螺旋桨</strong>：60。使用Blackbox和常识来找到最适合您的无人机的值。"\r
    },\r
    "ezTuneAxisRatioTips": {\r
        "message": "描述了您的无人机的质量/惯性分布。框架越长（前后轴上的质量越多），需要的轴比率就越高。完美的X型框架比例为100。大多数现代框架应该在110和130之间适用。默认的110是一个不错的起点。"\r
    },\r
    "ezTuneResponseTips": {\r
        "message": "此设置定义了无人机对摇杆运动和陀螺仪信号的反应速度。较高的值会导致更快的反应，但也会导致更多的超调和振荡。如果无人机感觉迟钝或有轻微的摆动，增加响应。如果电机过热、有听得见的振荡、超调或感觉过于紧张，减小响应。大多数现代四轴飞行器应该在响应低于80时飞行效果最佳。应与阻尼一起调整。它相当于P项。"\r
    },\r
    "ezTuneDampingTips": {\r
        "message": "描述了抵抗旋转速度变化的力量强度。它抑制了滚转和俯仰加速度，导致更平稳和更稳定的飞行。在调整过程中，您的任务是找出可以增加多少阻尼，而没有出现任何负面症状：电机过热、听得见的振荡、超调。大多数现代四轴飞行器应该接受高达150-180的“阻尼”。它相当于D项。"\r
    },\r
    "ezTuneStabilityTips": {\r
        "message": "定义了长期稳定性强度。大多数现代四轴飞行器应该容忍甚至高达120-130的“稳定性”。通常不需要调整。如果无人机在垂直下降时受到重力作用，降低“稳定性”可能会有所帮助。它相当于I项。"\r
    },\r
    "ezTuneAggressivenessTips": {\r
        "message": "定义了无人机对快速摇杆运动的反应速度。较高的“侵略性”会导致更快的快速机动。它不影响稳定性，只影响摇杆感觉。它相当于前馈项。"\r
    },\r
    "ezTuneRateTips": {\r
        "message": "定义了无人机绕滚动、俯仰和偏航轴的旋转速度。较高的“速率”会导致更快的旋转。值为0相当于300度每秒，100相当于600度每秒，200相当于900度每秒。"\r
    },\r
    "ezTuneExpoTips": {\r
        "message": "定义了RC输入的曲线。较低的值会导致中心位置的摇杆更敏感。较高的值会导致中心位置不敏感，并在摇杆末端反应更迅速。值为0相当于0曲线，100相当于0.7曲线，200相当于1.0曲线。"\r
    },\r
    "ezTunePidPreview": {\r
        "message": "PID预览"\r
    },\r
    "ezTuneRatePreview": {\r
        "message": "Rate 速率预览"\r
    },\r
    "ezTuneRatePreviewAxis" : {\r
        "message": "Axis"\r
    },\r
    "ezTuneRatePreviewRate" : {\r
        "message": "Rate"\r
    },\r
    "ezTuneRatePreviewExpo" : {\r
        "message": "曲线"\r
    },\r
    "ezTuneEnabledTips": {\r
        "message": "启用时，<strong>Ez Tune</strong> 将覆盖多个INAV设置，简化调整过程。您无需单独设置每个PID和滤波设置，只需使用7个滑块即可。Ez Tune将自动调整所有其他设置以满足您的需求。Ez Tune是新用户的绝佳起点，也是快速调整新无人机的绝佳方式。不建议在高级构建中使用Ez Tune，因为它会覆盖所有设置，您将无法微调无人机。启用Ez Tune后，<strong>PID调整</strong>选项卡中的设置将被EzTune覆盖。"\r
    },\r
    "ezTuneDisclaimer": {\r
        "message": "<strong>免责声明：</strong> Ez Tune是一项实验性功能。不能保证在所有无人机上正常工作。不能保证适用于所有机架类型。不能保证适用于所有螺旋桨。所有计算和调整结果可能会在INAV的未来版本中发生变化。我们仍然鼓励您尝试并在INAV Discord的<strong>#ez-tune</strong>频道中分享您的经验。"\r
    },\r
    "ezTuneNote": {\r
        "message": "<strong>重要提示</strong> 已启用Ez Tune。此选项卡上的所有设置由Ez Tune设置和控制。要使用PID调整选项卡，您必须禁用Ez Tune。要禁用它，请取消选中Ez Tune选项卡上的<strong>启用</strong>复选框。"\r
    },\r
    "gsActivated": {\r
        "message": "地面站模式已激活"\r
    },\r
    "gsDeactivated": {\r
        "message": "地面站模式已停用"\r
    },\r
    "gsTelemetry": {\r
        "message": "遥测"\r
    },\r
    "gsTelemetryLatitude": {\r
        "message": "纬度"\r
    },\r
    "gsTelemetryLongitude": {\r
        "message": "经度"\r
    },\r
    "gsTelemetryAltitude": {\r
    "message": "高度"\r
    },\r
    "gsTelemetryAltitudeShort": {\r
        "message": "高"\r
    },\r
    "gsTelemetryVoltageShort": {\r
        "message": "电池电压"\r
    },\r
    "gsTelemetrySats": {\r
        "message": "卫星"\r
    },\r
    "gsTelemetryFix": {\r
        "message": "定位"\r
    },\r
    "gsTelemetrySpeed": {\r
        "message": "速度"\r
    },\r
    "maintenance": {\r
        "message": "维护"\r
    },\r
    "maintenanceFlushSettingsCache": {\r
        "message": "清除设置缓存"\r
    },\r
    "gpsOptions": {\r
        "message": "GPS 设置"\r
    },\r
    "gpsOptionsAssistnowToken": {\r
        "message": "AssistNow 令牌"\r
    },\r
    "gpsLoadAssistnowOfflineButton": {\r
        "message": "加载 AssistNow 离线数据"\r
    },\r
    "gpsLoadAssistnowOnlineButton": {\r
        "message": "加载 AssistNow 在线数据"\r
    },\r
    "gpsAssistnowStart": {\r
        "message": "AssistNow 数据传输开始..."\r
    },\r
    "gpsAssistnowDone": {\r
        "message": "AssistNow 数据传输完成。"\r
    },\r
    "gpsAssistnowUpdate": {\r
        "message": "AssistNow 消息已发送。"\r
    },\r
    "gpsAssistnowLoadDataError": {\r
        "message": "加载 AssistNow 数据时出错。"\r
    },\r
    "adsbVehicleTotalMessages": {\r
        "message": "载具消息"\r
    },\r
    "adsbHeartbeatTotalMessages": {\r
        "message": "心跳消息"\r
    },\r
    "search": {\r
        "message": "搜索"\r
    },\r
    "currentLanguage": {\r
        "message": "zh-CN"\r
    }\r
}\r
`;export{n as default};
