(function recentTrackPlaylist() {
  const { Platform, CosmosAsync } = Spicetify;
  if (!(Platform && CosmosAsync)) {
    setTimeout(recentTrackPlaylist, 300);
    return;
  }
  // Icon - 'Activity Log Icon' from https://uxwing.com/activity-log-icon/
  const CONVERT_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 323 512.53" height="24" width="24" fill="var(--spice-text)">
  <path fill-rule="nonzero" d="M71.94 168.03l139.24.02c12-.05 11.88 19.83 0 19.83H71.94c-12.02 0-11.89-19.85 0-19.85zm102.75 322.39c7.81-1.03 13.98 6.6 11.33 14.02-1.38 3.76-4.59 6.41-8.57 6.94-9.19 1.17-18.43 1.45-27.68.83-34.03-2.29-64.64-17.04-87.33-39.73-24.73-24.73-40.04-58.9-40.04-96.66 0-37.73 15.31-71.91 40.04-96.65 24.74-24.73 58.92-40.04 96.66-40.04 13.09 0 25.83 1.88 38 5.4 10.09 2.91 19.68 6.95 28.64 11.95l-2.7-7.04c-2.25-5.91.72-12.52 6.63-14.78 5.9-2.25 12.53.71 14.77 6.63l11.39 29.79c.44 1.17.68 2.37.74 3.54.9 5.56-2.43 11.06-7.96 12.74l-30.5 9.33c-6.04 1.83-12.42-1.58-14.25-7.61-1.82-6.03 1.59-12.41 7.62-14.24l2.51-.77c-7.17-3.89-14.79-7.02-22.75-9.32-10.11-2.92-20.89-4.48-32.14-4.48-31.91 0-60.81 12.93-81.72 33.84-20.92 20.91-33.85 49.81-33.85 81.71 0 31.92 12.93 60.81 33.85 81.73 18.96 18.95 44.46 31.35 72.82 33.5 8.12.63 16.46.42 24.49-.63zm-36.51-170.19c0-5.83 4.72-10.57 10.56-10.57 5.84 0 10.55 4.74 10.55 10.57v64.31l44.02 19.34c5.33 2.35 7.75 8.58 5.41 13.91-2.35 5.33-8.57 7.75-13.91 5.41l-49.79-21.89c-4-1.5-6.84-5.37-6.84-9.89v-71.19zm73.32 158.9c-8.49 4.35-7.37 16.83 1.8 19.56 2.65.76 5.29.52 7.76-.71 6.81-3.43 13.36-7.45 19.49-11.99 3-2.23 4.55-5.75 4.23-9.47-.82-8.21-10.17-12.38-16.82-7.49a113.63 113.63 0 01-16.46 10.1zm43.09-37.86c-4.81 7.17.6 16.82 9.25 16.45 3.37-.19 6.39-1.84 8.3-4.67 4.27-6.35 7.97-13 11.14-19.97 3.05-6.87-1.71-14.58-9.24-14.91-4.32-.14-8.23 2.27-10.01 6.21-2.69 5.91-5.81 11.51-9.44 16.89zm19.42-54.18c-.38 4.15 1.62 8.04 5.21 10.14 6.74 3.84 15.04-.46 15.82-8.14.73-7.63.84-15.19.32-22.85-.26-3.67-2.4-6.91-5.65-8.62-7.33-3.8-16.01 1.88-15.43 10.11.44 6.49.34 12.88-.27 19.36zm-8.76-56.81c2.37 5.44 8.73 7.91 14.14 5.41 5.2-2.4 7.53-8.5 5.28-13.76a138.74 138.74 0 00-10.72-20.19c-5.18-7.96-17.37-5.64-19.25 3.67-.52 2.74-.03 5.41 1.49 7.77 3.5 5.46 6.53 11.13 9.06 17.1zM209.29 42.76l73.08 68.45h-73.08V42.76zM323 124.62c0-5.54-4.11-10.56-8.86-15.34L206.5 4.48C204.28 1.7 200.86 0 197.12 0H21.87C9.77 0 0 9.76 0 21.86v282.71c6.47-13.52 14.71-26.09 24.43-37.41V24.31h160.42v99.06c0 6.72 5.45 12.26 12.27 12.26h101.46v136.02c11.77 8.79 18.13 22.74 24.42 35.54V124.62zM71.94 97.91h66.28c12.01 0 11.86 19.83 0 19.83H71.94c-12.02 0-11.9-19.83 0-19.83z"/>
  </svg>
  `;

  new Spicetify.Topbar.Button(
    "Playlist from Recently Played Tracks",
    CONVERT_ICON,
    makeRecentTrackPlaylist,
    false
  );

  const MAX_RECENT_TRACKS_REQUESTABLE = 50; // Spotify Get Recently Played API max tracks per request (https://developer.spotify.com/documentation/web-api/reference/get-recently-played)
  const API_DELAY = 5000; // Artificial delay in milliseconds between API calls

  async function makeRecentTrackPlaylist() {
    // Definitions

    const timeStamp = new Date().getTime(); // Current time as a unicode timestamp
    const outputTimeStamp = new Date(timeStamp).toLocaleString(); // Output time as date and time

    async function getRecentlyPlayedTrackURIs() {
      const numberOfRecentlyPlayedTracks = MAX_RECENT_TRACKS_REQUESTABLE;
      const requestURL = `https://api.spotify.com/v1/me/player/recently-played`;

      const response = await CosmosAsync.get(requestURL, {
        limit: numberOfRecentlyPlayedTracks,
        before: timeStamp,
      });

      if (!response) {
        throw new Error("Failed to get recently played tracks");
      }

      let recentlyPlayedTracks = response.items;

      console.log("Recently played tracks:", response);

      const recentlyPlayedTrackURIs = recentlyPlayedTracks.map(
        (recentlyPlayedTrack) => recentlyPlayedTrack.track.uri
      );
      return recentlyPlayedTrackURIs;
    }

    async function createEmptyPlaylist() {
      const response = await CosmosAsync.post(
        "https://api.spotify.com/v1/me/playlists",
        {
          name: `Recently Played Tracks (${outputTimeStamp})`,
          public: true,
          description:
            "Created with Spicetify Playlist from Recently Played Tracks",
        }
      );
      if (!response) {
        throw new Error("Failed to create empty playlist");
      }
      console.log("Playlist created:", response);
      return response;
    }

    async function addRecentTracksToNewPlaylist() {
      let recentlyPlayedTrackURIs = await getRecentlyPlayedTrackURIs();

      const historyPlaylist = await createEmptyPlaylist();
      const historyPlaylistHREF = historyPlaylist.href;
      const requestURL = `${historyPlaylistHREF}/tracks`; // i.e. https://api.spotify.com/v1/playlists/{playlist_id}/tracks

      const requestBody = { uris: recentlyPlayedTrackURIs };

      const response = await CosmosAsync.post(requestURL, requestBody);
      if (!response) {
        throw new Error("Failed to add tracks to playlist");
      }
      console.log("Added tracks to playlist:", response);

      return response;
    }

    // Execution
    Spicetify.showNotification(
      "Making recently played tracks playlist (wait ~5 seconds)..."
    );
    await new Promise((resolve) => setTimeout(resolve, API_DELAY));

    addRecentTracksToNewPlaylist()
      .then(() => {
        Spicetify.showNotification("Made recently played tracks playlist");
      })
      .catch((error) => {
        console.error(error);
        Spicetify.showNotification(
          "Failed to make recently played tracks playlist"
        );
      });
  }
})();
