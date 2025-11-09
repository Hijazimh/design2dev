#!/bin/sh

DIR="$(cd "$(dirname "$0")" && pwd)"
WRAPPER_JAR="$DIR/gradle/wrapper/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ]; then
  echo "Gradle wrapper JAR missing at $WRAPPER_JAR." >&2
  echo "Generate it by running 'gradle wrapper' from this directory." >&2
  exit 1
fi

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  JAVA_CMD="$JAVA_HOME/bin/java"
else
  if command -v java >/dev/null 2>&1; then
    JAVA_CMD="$(command -v java)"
  else
    echo "Java runtime not found. Install JDK 17+ and/or set JAVA_HOME." >&2
    exit 1
  fi
fi

exec "$JAVA_CMD" -Xmx64m -Xms64m -classpath "$WRAPPER_JAR" org.gradle.wrapper.GradleWrapperMain "$@"
