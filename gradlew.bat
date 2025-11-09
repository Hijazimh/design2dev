@ECHO OFF
SET DIR=%~dp0
SET WRAPPER_JAR=%DIR%\gradle\wrapper\gradle-wrapper.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Gradle wrapper JAR missing at %WRAPPER_JAR%.
  ECHO Generate it by running "gradle wrapper" from this directory.
  EXIT /B 1
)

IF NOT DEFINED JAVA_HOME (
  SET JAVA_CMD=java
) ELSE (
  SET JAVA_CMD=%JAVA_HOME%\bin\java.exe
)

"%JAVA_CMD%" -Xmx64m -Xms64m -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
