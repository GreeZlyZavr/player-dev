const configUrl = 'http://videoima.ru/config.json';
let elVideo;
let elPlay;
let elPause;
let elSoundOn;
let elSoundOff;
let adsLoaded = false;
let adContainer;
let adDisplayContainer;
let adsLoader;
let adsManager;
let adsRequest;
let countdownUi;
let duration;
let timeFull;
let timeLine;
let controls;
let logoIcon;
let config;
let request;


window.addEventListener('load', function (event) {

  init();

});

function mute() {
  elVideo.volume = 0;
  elVideo.muted = true;
  elSoundOff.style.display = 'flex';
  elSoundOn.style.display = 'none';
};

function unmute() {
  elVideo.volume = 1;
  elVideo.muted = false;
  elSoundOff.style.display = 'none';
  elSoundOn.style.display = 'flex';
};

function play() {

  elVideo.play();
  elPlay.style.display = 'none';
  elPause.style.display = 'flex';
};

function pause() {
  elVideo.pause();
  elPlay.style.display = 'flex';
  elPause.style.display = 'none';
};

function secondsToTime(time) {

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
};








function init() {
  elPlay = document.getElementById('el-play');
  elPause = document.getElementById('el-pause');
  elSoundOn = document.getElementById('el-soundOn');
  elSoundOff = document.getElementById('el-soundOff');
  timePicker = document.getElementById('timer');
  elVideo = document.getElementById('el-video');
  duration = document.getElementById('duration');
  timeFull = document.querySelector('.timeFull');
  timeLine = document.querySelector('.timeLine');
  panelControls = document.querySelector('.panelControls');
  logoIcon = document.getElementById('el-logoIcon');

  elVideo.addEventListener('play', function (event) {
    loadAds(event);
  });


  elVideo.addEventListener('canplay', function () {

    duration.innerHTML = secondsToTime(elVideo.duration);
  });


  elVideo.addEventListener('timeupdate', function () {

    timePicker.innerHTML = secondsToTime(elVideo.currentTime);
    timeLine.style.width = (parseInt(elVideo.currentTime) / parseInt(elVideo.duration)) * 100 + '%';
  }, false);


  elSoundOn.addEventListener('click', () => mute());
  elSoundOff.addEventListener('click', () => unmute());
  elPlay.addEventListener('click', () => play());
  elPause.addEventListener('click', () => pause());

  initializeIMA();
}



async function initializeIMA() {

  console.log("initializing IMA");
  adContainer = document.getElementById('el-ad');
  countdownUi = document.getElementById('countdownUi');
  adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, elVideo);
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);


  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false);
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false);


  elVideo.addEventListener('ended', function () {
    adsLoader.contentComplete();
  });


  const jsonConfig = await getVastUrl(configUrl);


  adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = jsonConfig.vastUrl;

  adsRequest.linearAdSlotWidth = elVideo.clientWidth;
  adsRequest.linearAdSlotHeight = elVideo.clientHeight;
  adsRequest.nonLinearAdSlotWidth = elVideo.clientWidth;
  adsRequest.nonLinearAdSlotHeight = elVideo.clientHeight / 3;

  adContainer.addEventListener('click', adContainerClick);

  adsLoader.requestAds(adsRequest);

}



function loadAds(event) {

  if (adsLoaded) {
    return;
  }
  adsLoaded = true;
  console.log("loading ads");
  elVideo.load();
  adDisplayContainer.initialize();
  let width = elVideo.clientWidth;
  let height = elVideo.clientHeight;

  try {

    adsManager.init(width, height, google.ima.ViewMode.NORMAL);
    console.log("AdsManager started");

    adsManager.start();
  } catch (adError) {

    console.log("AdsManager could not be started");
    elVideo.play();
  }
}



function onAdsManagerLoaded(adsManagerLoadedEvent) {

  let adsRenderingSettings = new google.ima.AdsRenderingSettings();

  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  adsManager = adsManagerLoadedEvent.getAdsManager(elVideo, adsRenderingSettings);

  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
  adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);

}




function onAdEvent(adEvent) {

  let ad = adEvent.getAd();
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:

      if (!ad.isLinear()) {


        elVideo.play();
      }
      break;
    case google.ima.AdEvent.Type.STARTED:

      logoIcon.style.display = 'none';
      panelControls.style.display = 'none';
      countdownUi.style.display = 'flex';
      if (ad.isLinear()) {

        intervalTimer = setInterval(
          function () {
            let remainingTime = adsManager.getRemainingTime();
            countdownUi.innerHTML = 'Осталось: ' + parseInt(remainingTime);
          },
          300);
      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:


      countdownUi.style.display = 'none';
      panelControls.style.display = 'flex';
      logoIcon.style.display = 'flex';
      if (ad.isLinear()) {
        clearInterval(intervalTimer);
      }
      break;
  }
}


function onAdError(adErrorEvent) {

  console.log(adErrorEvent.getError());
  if (adsManager) {
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
  if (elVideo.paused) {
    elVideo.play();
  } else {
    elVideo.pause();
  }
}



async function getVastUrl(url) {
  console.log("fetching...");
  const response = await fetch(url);
  const data = await response.json()
  console.log(data.vastUrl);
  return data;

}