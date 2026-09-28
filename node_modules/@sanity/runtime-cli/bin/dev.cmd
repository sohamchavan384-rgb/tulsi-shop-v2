@echo off

node --import jiti/register --no-warnings=ExperimentalWarning "%~dp0\dev" %*
