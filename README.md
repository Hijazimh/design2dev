# Titan Spotify Controller

Android application prototype for the Unihertz Titan 2 that mirrors media controls on the rear subscreen to remotely control playback within the Spotify client. It uses the Spotify App Remote SDK to authenticate with a user session and expose a compact control surface on the secondary display.

## Features

- Connects to the Spotify App Remote SDK and synchronises playback state.
- Presents track and artist metadata on both the main display and Titan 2 rear subscreen.
- Offers play/pause, previous, and next controls from either screen.
- Detects the rear presentation-capable display and automatically mounts a `Presentation` tailored for the subscreen.

## Project Structure

```
app/
  build.gradle.kts        # Module configuration
  src/main/
    AndroidManifest.xml   # Permissions, intent filters, multi-display handling
    java/com/unihertztitan/spotifycontroller/
      MainActivity.kt            # Primary UI + lifecycle glue
      SpotifyController.kt       # Spotify App Remote integration
      TitanSubscreenManager.kt   # Rear display detection/attachment
      TitanSubscreenPresentation.kt # Subscreen UI wiring
    res/layout/            # Main and subscreen layouts
    res/values/            # Strings, colours, theme
```

The Gradle wrapper properties are included, but the wrapper JAR is omitted. Generate it locally before building (see below).

## Prerequisites

1. **Spotify Developer Credentials**
   - Create an app at <https://developer.spotify.com/dashboard>.
   - Note the *Client ID*.
   - Add a Redirect URI (e.g. `titan-controller://callback`).

2. **Android Tooling**
   - JDK 17 or newer on your workstation.
   - Android Studio Giraffe or later (recommended) or the Android command-line tools.

3. **Gradle Wrapper JAR**
   - Run `gradle wrapper` once from the repository root to download `gradle/wrapper/gradle-wrapper.jar`. Alternatively, open the project in Android Studio and let it sync, which will generate the wrapper automatically.

## Configuration

Update the placeholders in `app/src/main/res/values/strings.xml`:

- `spotify_client_id`: replace with the value from the Spotify dashboard.
- `spotify_redirect_scheme` and `spotify_redirect_host`: split your redirect URI (`scheme://host`). The manifest intent-filter will use these values, so they must match the URI registered with Spotify.

After changing these values, reinstall the app so Android refreshes the manifest data.

## Building & Running

1. Generate the Gradle wrapper JAR (once):
   ```bash
   cd /path/to/project
   gradle wrapper
   ```

2. Build the debug APK:
   ```bash
   ./gradlew assembleDebug
   ```

3. Install on a connected Titan 2:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

4. Launch the app on the main display. Sign into Spotify when prompted. The rear subscreen should display a compact control UI once the presentation-capable display is detected. You can wake the rear display by double-tapping it on the device.

## Usage Notes

- The Spotify App Remote SDK requires the Spotify app to be installed and logged in on the device.
- Authentication tokens are stored within the Spotify app, not this controller. Revoking the app's access from the Spotify dashboard will invalidate future connections.
- The subscreen manager attempts to identify the Titan rear display by name. If Unihertz changes the identifier in future firmware, adjust `TitanSubscreenManager.findRearDisplay()` accordingly.
- Consider hardening the connection flow (error surface, retry/backoff) before production deployment.

## Next Steps

- Persist the last known playback metadata locally to show cached information before reconnecting.
- Add album artwork rendering using the Spotify Images API.
- Provide quick actions (shuffle, repeat) and haptic feedback on button press.
- Package a signed release build and distribute via an internal channel for field testing.
