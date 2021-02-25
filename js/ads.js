// Define a variable to track whether there are ads loaded and initially set it to false
let elVideo ;
let elPlay;
let elPause;
let elSoundOn;
let elSoundOff;
let adsLoaded = false;
let adContainer;
let adDisplayContainer;
let adsLoader;
let adsManager;
let countdownUi;
let timePicker;
let videoTime;

window.addEventListener('load', function(event) {

  elPlay = document.getElementById('el-play');
  elPause = document.getElementById('el-pause');
  elSoundOn = document.getElementById('el-soundOn');
  elSoundOff = document.getElementById('el-soundOff');
  timePicker = document.getElementById('timer');
  videoTime = document.getElementById('videoTime');

  elVideo = document.getElementById('el-video');
  elVideo.volume = 0;
  elVideo.muted = true;
  

  initializeIMA();
  elVideo.addEventListener('play', function(event) {
    loadAds(event);
  });

  // событие срабатывает, когда видео готово к воспроизведению
  elVideo.addEventListener('canplay', function() {
    videoTime.setAttribute('max', elVideo.duration);
  });

  // событие срабатывает, когда изменяется время видео
  elVideo.addEventListener('timeupdate', function () {
    timePicker.innerHTML = secondsToTime(elVideo.currentTime);
    videoTime.setAttribute('value', elVideo.currentTime);
  }, false);

  // событие срабатывает, когда меняется время воспроизведения
  elVideo.addEventListener('seeking', function () {
    
  });
  // событие срабатывает, когда передвигается ползунок videoTime
  videoTime.addEventListener('onSlide', function () {
    elVideo.pause();
  });
  // событие срабатывает, когда ползунок videoTime передвинут
  videoTime.addEventListener('onChange', function () {
    elVideo.currentTime = videoTime.getAttribute('value');
    console.log(videoTime.getAttribute('value'));
    elVideo.play();
  });


  // рассчет отображаемого времени
  function secondsToTime(time){
    
    var h = Math.floor(time / (60 * 60)),
        dm = time % (60 * 60),
        m = Math.floor(dm / 60),
        ds = dm % 60,
        s = Math.ceil(ds);
    if (s === 60) {
        s = 0;
        m = m + 1;
    }
    if (s < 10) {
        s = '0' + s;
    }
    if (m === 60) {
        m = 0;
        h = h + 1;
    }
    if (m < 10) {
        m = '0' + m;
    }
    if (h === 0) {
        fulltime = m + ':' + s;
    } else {
        fulltime = h + ':' + m + ':' + s;
    }
    return fulltime;
  }





  elSoundOn.addEventListener('click', () => mute());
  elSoundOff.addEventListener('click', () => unmute());
  elPlay.addEventListener('click', () => play());
  elPause.addEventListener('click', () => pause());

});

window.addEventListener('resize', function(event) {
  console.log("window resized");
  if(adsManager) {
    let width = elVideo.clientWidth;
    let height = elVideo.clientHeight;
    adsManager.resize(width, height, google.ima.ViewMode.NORMAL);
  }
});

function initializeIMA() {
  
  console.log("initializing IMA");
  adContainer = document.getElementById('el-ad');//ad-container
  countdownUi = document.getElementById('countdownUi');
  progressBar = document.getElementById('progressBar');
  adContainer.addEventListener('click', adContainerClick);
  adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, elVideo);
  let adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false);
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false);

  // Let the AdsLoader know when the video has ended
  elVideo.addEventListener('ended', function() {
    adsLoader.contentComplete();
  });

  let adsRequest = new google.ima.AdsRequest();
  // adsRequest.adTagUrl = 'https://dsp-eu.surfy.tech/bid/vast-container?ssp=26';
  // adsRequest.adTagUrl = 'https://dsp-eu.surfy.tech/bid/vast-container?ssp=44';
  // adsRequest.adTagUrl = 'https://dsp-eu.surfy.tech/vast?id=FROgrVIXqYrhUZRexwWeKehfUQvSVAWc&w=640&h=360';
  // adsRequest.adTagUrl = 'https://dsp-eu.surfy.tech/bid/vast-container?ssp=6';
  // adsRequest.adTagUrl = 'https://clientside-video-bidder.rutarget.ru/bid?url={domain}&request_id={bidid}&placement_id=113&mimes=video%2Fmp4&mimes=application%2Fjavascript&protocols=2&vd_api_0=VPAID_2_0&placement=3';
  // adsRequest.adTagUrl = 'https://kinoaction.ru/index.php?r=vast%2Fvpaid&id=1332';
  // adsRequest.adTagUrl = 'http://dsp-eu.surfy.tech/bid/vast-container?ssp=6';
  // adsRequest.adTagUrl = 'https://kinoaction.ru/index.php?ch=notCh&r=vast%2Flinkvpaid&type=vpaid&url_ref&link_id=37595';

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = elVideo.clientWidth;
  adsRequest.linearAdSlotHeight = elVideo.clientHeight;
  adsRequest.nonLinearAdSlotWidth = elVideo.clientWidth;
  adsRequest.nonLinearAdSlotHeight = elVideo.clientHeight / 3;

  // Pass the request to the adsLoader to request ads
  adsLoader.requestAds(adsRequest);

}

function loadAds(event) {
  // Prevent this function from running on if there are already ads loaded
  if(adsLoaded) {
    return;
  }
  adsLoaded = true;

  // Prevent triggering immediate playback when ads are loading
  event.preventDefault();

  console.log("loading ads");

  // Initialize the container. Must be done via a user action on mobile devices.
  elVideo.load();
  adDisplayContainer.initialize();

  let width = elVideo.clientWidth;
  let height = elVideo.clientHeight;
  console.log(width);
  console.log(height);
  // adsManager.init(width, height, google.ima.ViewMode.NORMAL);
  // adsManager.start();


  try {
    adsManager.init(width, height, google.ima.ViewMode.NORMAL);
    console.log("AdsManager started");
    adsManager.start();
  } catch (adError) {
    // Play the video without ads, if an error occurs
    console.log("AdsManager could not be started");
    elVideo.play();
  }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  let adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

  // Instantiate the AdsManager from the adsLoader response and pass it the video element
  adsManager = adsManagerLoadedEvent.getAdsManager(elVideo, adsRenderingSettings);

  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);

  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);

  adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);

  adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);

  adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    elPlay.style.display = 'none';
    elPause.style.display = 'block';
    adsManager.start();
} catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    elVideo.play();
    elPlay.style.display = 'none';
    elPause.style.display = 'block';
}
}

function onAdError(adErrorEvent) {
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  if(adsManager) {
    adsManager.destroy();
  }

}

function onContentPauseRequested() {
  elVideo.pause();
}

function onContentResumeRequested() {
  elVideo.play();
}

function adContainerClick(event) {
    console.log("ad container clicked");
    if(elVideo.paused) {
      elVideo.play();
    } else {
      elVideo.pause();
    }
  }



// function onAdLoaded(adEvent) {
//   let ad = adEvent.getAd();
//   if (!ad.isLinear()) {
//     elVideo.play();
//   }
// }


function onAdEvent(adEvent) {
  // Извлеките объявление из события. Некоторые события (например, ALL_ADS_COMPLETED) не связаны с объектом ad.
  let ad = adEvent.getAd();
  switch (adEvent.type) {
      case google.ima.AdEvent.Type.LOADED:
          // Это первое событие, отправленное для объявления - можно определить, является ли объявление видеорекламой или overlay.
          if (!ad.isLinear()) {
            // Правильно расположите AdDisplayContainer для наложения.
            // Использовать ad.width и ad.height.
              elVideo.play();
          }
          break;
      case google.ima.AdEvent.Type.STARTED:
          // Этот ивент говорит о начале рекламы - 
          // видеоплеер может настроить пользовательский интерфейс, 
          // например отобразить кнопку паузы и оставшееся время.
          if (ad.isLinear()) {
              // For a linear ad, a timer can be started to poll for
              // the remaining time.
              elPlay.style.display = 'none';
              elPause.style.display = 'none';
              elSoundOff.style.display = 'none';
              elSoundOn.style.display = 'none';
              intervalTimer = setInterval(
                function() {
                      let remainingTime = adsManager.getRemainingTime();
                      // let adDuration = ad.getDuration();
                      // let theTime = Math.round((1 - ( parseInt(remainingTime) / adDuration)) * 100); 
                      // console.log(theTime);
                      // let txt = 'transform: translate(' + theTime + '%); ';
                      // txt += '-webkit-transform: translate(' + theTime + '%); ';
                      // txt += '-o-transform: translate(' + theTime + '%); '; 
                      // progressBar.style.cssText = txt;
                      countdownUi.innerHTML = 'Осталось: ' + parseInt(remainingTime);
                          
                  },
                  300);
                  
          }
          break;
      case google.ima.AdEvent.Type.COMPLETE:
          // Этот ивент говорит о завершении рекламы 
          // можно удалить элементы рекламы 
          elPlay.style.display = 'none';
          elPause.style.display = 'block';
          elSoundOff.style.display = 'block';
          elSoundOn.style.display = 'none';
          if (ad.isLinear()) {
              clearInterval(intervalTimer);
          }
          break;
  }
}

// Элементы управления вастом

// function muteAd() {
//   adsManager.setVolume(0);
//   // elVideo.setVolume(0);
  

//   elVideo.volume = 0;
//   elVideo.muted = true;
//   elSoundOff.style.display = 'block';
//   elSoundOn.style.display = 'none';
// };

// function unmuteAd() {
//   adsManager.setVolume(1);
//   // elVideo.setVolume(1);

//   elVideo.volume = 1;
//   elVideo.muted = false;
//   elSoundOff.style.display = 'none';
//   elSoundOn.style.display = 'block';
// };

// function playAd() {
//   // elVideo.volume = 1;
//   // elVideo.muted = false;
//   adsManager.resume();
//   // elVideo.play();
//   elPlay.style.display = 'none';
//   elPause.style.display = 'block';
// };

// function pauseAd() {
//   // elVideo.volume = 0;
//   // elVideo.muted = false;
//   adsManager.pause();
//   // elVideo.pause();
//   elPlay.style.display = 'block';
//   elPause.style.display = 'none';
// };

// Элементы управления видео

function mute() {
  // adsManager.setVolume(0); 
  elVideo.volume = 0;
  elVideo.muted = true;
  elSoundOff.style.display = 'block';
  elSoundOn.style.display = 'none';
};

function unmute() {
  // adsManager.setVolume(1);
  elVideo.volume = 1;
  elVideo.muted = false;
  elSoundOff.style.display = 'none';
  elSoundOn.style.display = 'block';
};

function play() {
  // adsManager.resume();
  elVideo.play();
  elPlay.style.display = 'none';
  elPause.style.display = 'block';
};

function pause() {
  // adsManager.pause();
  elVideo.pause();
  elPlay.style.display = 'block';
  elPause.style.display = 'none';
};

