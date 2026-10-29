# Vault 本地极简轻量构建与真机直推脚本
# 100% 离线依赖、免安装 Android Studio、直连 Samsung 真机

param (
    [string]$Mode = "release",   # "release" 或 "debug"
    [switch]$Install             # 编译完成后是否自动通过 ADB 安装到手机
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Vault 本地轻量化原生构建器 (Expo SDK 54)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. 注入轻量环境
$ToolsDir = "C:\Users\rhett\.tools"
$env:JAVA_HOME = "$ToolsDir\jdk-17"
$env:ANDROID_HOME = "$ToolsDir\android-sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# 2. 校验运行环境
if (!(Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Error "未找到 JDK 17，请检查路径: $env:JAVA_HOME"
    exit 1
}
if (!(Test-Path "$env:ANDROID_HOME\platforms")) {
    Write-Error "未找到 Android SDK，请检查路径: $env:ANDROID_HOME"
    exit 1
}

Write-Host "✅ 运行环境就绪:" -ForegroundColor Green
Write-Host "   - JAVA_HOME: $env:JAVA_HOME"
Write-Host "   - ANDROID_HOME: $env:ANDROID_HOME"

# 3. 准备 Android 原生工程目录
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

if (!(Test-Path "$ProjectRoot\android")) {
    Write-Host "📦 首次生成 Android 原生工程 (prebuild)..." -ForegroundColor Yellow
    npx expo prebuild --platform android --no-install
}

# 4. 执行 Gradle 原生编译
Set-Location "$ProjectRoot\android"

$gradleTask = if ($Mode -eq "release") { "assembleRelease" } else { "assembleDebug" }
Write-Host "⚙️ 正在执行本地 Gradle 构建: $gradleTask ..." -ForegroundColor Yellow

$buildStart = Get-Date
.\gradlew.bat $gradleTask --no-daemon
$buildDuration = (Get-Date) - $buildStart

Write-Host "🎉 构建成功！总耗时: $($buildDuration.TotalSeconds.ToString('F1')) 秒" -ForegroundColor Green

# 5. 定位产出的 APK 文件
$apkSubPath = if ($Mode -eq "release") { "app\build\outputs\apk\release\app-release.apk" } else { "app\build\outputs\apk\debug\app-debug.apk" }
$apkFullPath = Join-Path "$ProjectRoot\android" $apkSubPath

if (Test-Path $apkFullPath) {
    $apkItem = Get-Item $apkFullPath
    $sizeMb = ($apkItem.Length / 1MB).ToString("F2")
    Write-Host "📱 APK 输出路径: $apkFullPath ($sizeMb MB)" -ForegroundColor Cyan

    # 6. 若指定 -Install 或用户插了手机，尝试推送到真机
    if ($Install) {
        Write-Host "📲 正在通过 ADB 推送安装到手机 (无损覆盖保留数据)..." -ForegroundColor Yellow
        adb install -r $apkFullPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 安装成功！正在唤起 Vault..." -ForegroundColor Green
            adb shell am start -n "com.rhettholmes.vault/.MainActivity"
        } else {
            Write-Warning "ADB 推送失败，请检查手机是否开启 USB 调试且已解锁屏幕。"
        }
    }
} else {
    Write-Warning "未找到生成的 APK，请检查 Gradle 输出日志。"
}

Set-Location $ProjectRoot
