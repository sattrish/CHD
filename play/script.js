  // Configuration
  const config = {
    defaultThumbnail: "",
    defaultStream: "https://cdn.lykstage.com/hls/5/vod/97115/97115.m3u8",
    channelsJsonUrl: "/CHD/api/output2.json" 
  };

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const filex = urlParams.get("url");
  const channelId = urlParams.get("id");
  const thumb = urlParams.get('thumb');
  const seekParam = urlParams.get("s");

  const playerInstance = jwplayer('player');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Show loading spinner
  function showLoading() {
    loadingSpinner.style.display = 'block';
  }

  // Hide loading spinner
  function hideLoading() {
    loadingSpinner.style.display = 'none';
  }

  // Initialize player with default or URL-provided source
  function initPlayer(source, thumbnail) {
    playerInstance.setup({
      width: "100%",
      height: "100%",
      key: "cLGMn8T20tGvW+0eXPhq4NNmLB57TrscPjd1IyJF84o=",
      image: thumbnail || config.defaultThumbnail,
      sources: [{ file: source }],
      primary: "html5",
      autostart: true,
      mute: true
    });
    
    setupPlayerEvents();
  }

  // Setup player events and custom controls
  function setupPlayerEvents() {
    // When the player is ready, perform additional setup
    playerInstance.on("ready", function() {
      // If a valid seek time is provided, convert to a number and seek
      if (seekParam !== null && !isNaN(seekParam)) {
        var seekTime = parseInt(seekParam, 10);
        if (seekTime > 0) {
          playerInstance.seek(seekTime);
        }
      }

      // Move the timeslider in-line with other controls
      const playerContainer = playerInstance.getContainer();
      const buttonContainer = playerContainer.querySelector(".jw-button-container");
      const spacer = buttonContainer.querySelector(".jw-spacer");
      const timeSlider = playerContainer.querySelector(".jw-slider-time");
      if (buttonContainer && spacer && timeSlider) {
        buttonContainer.replaceChild(timeSlider, spacer);
      }

      // Detect adblock and show modal
      playerInstance.on("adBlock", () => {
        const modal = document.querySelector("div.modal");
        if (modal) {
          modal.style.display = "flex";
          document.getElementById("close").addEventListener("click", () => location.reload());
        }
      });

      // Add forward/rewind functionality (forward 10 seconds)
      const rewindContainer = playerContainer.querySelector(".jw-display-icon-rewind");
      if (rewindContainer) {
        const forwardContainer = rewindContainer.cloneNode(true);
        const forwardDisplayButton = forwardContainer.querySelector(".jw-icon-rewind");
        forwardDisplayButton.style.transform = "scaleX(-1)";
        forwardDisplayButton.ariaLabel = "Forward 10 Seconds";
        const nextContainer = playerContainer.querySelector(".jw-display-icon-next");
        if (nextContainer) {
          nextContainer.parentNode.insertBefore(forwardContainer, nextContainer);
        }

        // Hide next button and duplicate rewind for control bar
        playerContainer.querySelector(".jw-display-icon-next").style.display = "none";
        const rewindControlBarButton = buttonContainer.querySelector(".jw-icon-rewind");
        if (rewindControlBarButton) {
          const forwardControlBarButton = rewindControlBarButton.cloneNode(true);
          forwardControlBarButton.style.transform = "scaleX(-1)";
          forwardControlBarButton.ariaLabel = "Forward 10 Seconds";
          rewindControlBarButton.parentNode.insertBefore(forwardControlBarButton, rewindControlBarButton.nextElementSibling);

          // Attach click handlers to both forward buttons to seek forward by 10 seconds
          [forwardDisplayButton, forwardControlBarButton].forEach((button) => {
            button.onclick = () => {
              playerInstance.seek(playerInstance.getPosition() + 10);
            };
          });
        }
      }
    });

    // Add a custom button to cycle through stretching modes
    playerInstance.on('ready', function() {
      playerInstance.addButton(
        "https://doyeltv.vercel.app/src/stream/res/zoom.svg",
        "Change Stretching",
        function() {
          const currentStretching = playerInstance.getConfig().stretching;
          const stretchingModes = ["uniform", "exactfit", "fill"];
          const nextIndex = (stretchingModes.indexOf(currentStretching) + 1) % stretchingModes.length;
          const nextStretching = stretchingModes[nextIndex];
          playerInstance.setConfig({ stretching: nextStretching });
        },
        "custom-button"
      );
    });
  }

  // Fetch channel from JSON
  async function fetchChannel(channelId) {
    showLoading();
    try {
      const response = await fetch(config.channelsJsonUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data[channelId] && data[channelId].file) {
        return data[channelId].file;
      } else {
        throw new Error('Channel not found in JSON');
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
      return null;
    } finally {
      hideLoading();
    }
  }

  // Main initialization
  async function initializePlayer() {
    let source = config.defaultStream;
    let thumbnail = thumb || config.defaultThumbnail;
    
    // Priority 1: Direct stream URL (play parameter)
    if (filex) {
      initPlayer(filex, thumbnail);
      return;
    }
    
    // Priority 2: Channel from JSON (id parameter)
    if (channelId) {
      const channelSource = await fetchChannel(channelId);
      if (channelSource) {
        initPlayer(channelSource, thumbnail);
        return;
      }
      console.warn('Channel not found, falling back to default stream');
    }
    
    // Fallback to default stream
    initPlayer(source, thumbnail);
  }

  // Start the player initialization
  initializePlayer();
