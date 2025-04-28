
# RN工程

## 安装依赖

rn工程根目录下运行

```bash
npm install
```

## 本地依赖

复制 `react_native_openharmony-0.72.59.har` 到 `harmony/libs/react_native_openharmony-0.72.59.har`

## 鸿蒙环境配置

### 鸿蒙环境配置，设置环境变量

设置变量 `HDC_SERVER_PORT` 为 `65037`

设置变量 `RNOH_C_API_ARCH` 为 `1`
 
### 同步工程 
使用 DevEco Studio 打开 `harmony` 工程等待同步完成

### 运行codegen。
在rn工程目录下运行 `npm run codegen`


## 运行

### 运行RN工程
在rn工程目录运行
```bash
npm run start
```
开始运行 rn 服务，默认运行在本机 `8081` 端口

### 运行鸿蒙工程

#### 运行
进入 DevEco Studio，连接鸿蒙设备，点击运行
> 连接鸿蒙真机调试运行需要事先申请华为开发者账号并登录，否则会提示没有签名不能运行

进入app后，摇动设备，在弹出的开发者菜单中选择 `Settings`

点击 `Debug Server host & port for device`, 在弹出的对话框中填写上一步中 rn服务的 ip 地址及端口号，如 `192.168.1.100:8081`

重启 app 后即连接上 rn 服务，可进行开发调试


# Web工程

可以修改工程中webview加载的url选择加载本地工程或在线工程