@echo off
setlocal ENABLEDELAYEDEXPANSION

rem Usage: release.bat [patch|minor|major] [--publish] [--dry-run]
set VERSION=patch
set PUBLISH=
set DRYRUN=

:parse
if "%~1"=="" goto run
if /I "%~1"=="patch" set VERSION=patch& shift & goto parse
if /I "%~1"=="minor" set VERSION=minor& shift & goto parse
if /I "%~1"=="major" set VERSION=major& shift & goto parse
if /I "%~1"=="--publish" set PUBLISH=-Publish& shift & goto parse
if /I "%~1"=="--dry-run" set DRYRUN=-DryRun& shift & goto parse

echo Unknown argument: %~1
exit /b 1

:run
powershell.exe -ExecutionPolicy Bypass -File "%~dp0release.ps1" -VersionType %VERSION% %PUBLISH% %DRYRUN%
exit /b %ERRORLEVEL%
