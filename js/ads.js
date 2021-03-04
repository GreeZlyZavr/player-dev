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

// ------ ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ПЛЕЕРА ------

// Событие срабатывает при полной загрузке страницы
window.addEventListener('load', function (event) {

  elPlay = document.getElementById('el-play'); // Кнопка play
  elPause = document.getElementById('el-pause'); // Кнопка pause
  elSoundOn = document.getElementById('el-soundOn'); // Кнопка mute
  elSoundOff = document.getElementById('el-soundOff'); // Кнопка unmute
  timePicker = document.getElementById('timer'); // Отображает текущее время проигрования
  elVideo = document.getElementById('el-video'); // Место размещения основного видео
  duration = document.getElementById('duration'); // Полное время отображения времени
  timeFull = document.querySelector('.timeFull'); // Полная полоса прогресса видео
  timeLine = document.querySelector('.timeLine'); // Полоса текущего времени видео
  panelControls = document.querySelector('.panelControls'); // Панель со всеми кнопками
  logoIcon = document.getElementById('el-logoIcon');

  initializeIMA();
  elVideo.addEventListener('play', function (event) {
    loadAds(event);
  });

  // Событие срабатывает, когда видео готово к воспроизведению
  elVideo.addEventListener('canplay', function () {
    // Добавляем продолжительность видео контента
    duration.innerHTML = secondsToTime(elVideo.duration);
  });

  // Событие срабатывает, когда изменяется текущее время видео
  elVideo.addEventListener('timeupdate', function () {
    // Делаем подвижной полосу текущего времени видео
    timePicker.innerHTML = secondsToTime(elVideo.currentTime);
    timeLine.style.width = (parseInt(elVideo.currentTime) / parseInt(elVideo.duration)) * 100 + '%';
  }, false);

  // События для кнопок упраления
  elSoundOn.addEventListener('click', () => mute());
  elSoundOff.addEventListener('click', () => unmute());
  elPlay.addEventListener('click', () => play());
  elPause.addEventListener('click', () => pause());

  
  // событие срабатывает, когда изменяется размер окна
  // !!! НЕГОТОВАЯ ЧАСТЬ КОДА !!!
  // -- начало
/*
  window.addEventListener('resize', function (event) {
    console.log("window resized");
    console.log(adsManager);
    if (adsManager) {
      // изменение размера видео
      let width = elVideo.clientWidth;
      let height = elVideo.clientHeight;
      adsManager.resize(width, height, google.ima.ViewMode.NORMAL);
    }
  });

  // событие срабатывает при клике на полосу проигрования
 
  timeFull.addEventListener("click", function (e) {
    let posClientX = e.clientX; // Вычисляем позицию нажатия
    let posBlockX = timeLine.clientX;
    let windowWidth = window.innerWidth;
    // let timePos = (posClientX * 100) / parseInt(timeLine.offsetWidth); // Вычисляем процент перемотки
    let timePos = ( parseInt(posClientX) / parseInt(windowWidth) ) * 100; // Вычисляем процент перемотки
    timeLine.style.width = timePos + '%'; // Присваиваем процент перемотки
    console.log('windowWidth: '+ windowWidth);
    console.log('posBlockX: '+ posBlockX);
    console.log('posClientX: '+ posClientX);
    // console.log('timeFull.offsetWidth: '+ timeFull.offsetWidth);
    // console.log('timeFull.offsetWidth: '+ parseInt(timeFull.offsetWidth));
    console.log('timePos: '+ timePos);
    // console.log('elVideo.duration: '+ elVideo.duration);
    // console.log('Math.round: '+ Math.round(elVideo.duration));
    // console.log('timePos * Math.round(elVideo.duration): '+ timePos * Math.round(elVideo.duration));
    elVideo.currentTime = (timePos / 100 * Math.round(elVideo.duration)) ; // Перематываем
  });
    */

   // -- конец --



});

// Элементы управления видео

function mute() {
  // adsManager.setVolume(0); 
  elVideo.volume = 0;
  elVideo.muted = true;
  elSoundOff.style.display = 'flex';
  elSoundOn.style.display = 'none';
};

function unmute() {
  // adsManager.setVolume(1);
  elVideo.volume = 1;
  elVideo.muted = false;
  elSoundOff.style.display = 'none';
  elSoundOn.style.display = 'flex';
};

function play() {
  // adsManager.resume();
  elVideo.play();
  elPlay.style.display = 'none';
  elPause.style.display = 'flex';
};

function pause() {
  // adsManager.pause();
  elVideo.pause();
  elPlay.style.display = 'flex';
  elPause.style.display = 'none';
};

  // Рассчет отображаемого времени
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

  



// ------ GOOGLE IMA SDK И РЕКЛАМА ------

// метод инициализации Google IMA SDK
function initializeIMA() {

  console.log("initializing IMA");
  adContainer = document.getElementById('el-ad'); // Контейнер для проигрывания рекламы
  countdownUi = document.getElementById('countdownUi'); // Счетчик времени рекламы
  adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, elVideo); // Контейнер, в котором будет отображаться реклама
  adsLoader = new google.ima.AdsLoader(adDisplayContainer); // AdsLoader для запроса рекламы с серверов объявлений

  // Обработчики AdsLoader
  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false);
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false);

  // Сообщяем AdsLoader, когда видео закончится
  elVideo.addEventListener('ended', function () {
    adsLoader.contentComplete();
  });

  // Свойства запроса объявления
  adsRequest = new google.ima.AdsRequest(); 

  // URL-адрес рекламного тега, который запрашивается с рекламного сервера
  adsRequest.adTagUrl = 'http://dsp-eu.surfy.tech/bid/vast-container?ssp=6';


  // Указываем линейные и нелинейные размеры слотов.
  adsRequest.linearAdSlotWidth = elVideo.clientWidth;
  adsRequest.linearAdSlotHeight = elVideo.clientHeight;
  adsRequest.nonLinearAdSlotWidth = elVideo.clientWidth;
  adsRequest.nonLinearAdSlotHeight = elVideo.clientHeight / 3;

  // Делаем контейнер кликабельным
  adContainer.addEventListener('click', adContainerClick); 

  // Передаем запрос в adsLoader для запроса рекламы
  adsLoader.requestAds(adsRequest);

}

function loadAds(event) {
  // Эта функция не работает, если уже загружены объявления
  if (adsLoaded) {
    return;
  }
  adsLoaded = true;

  // Не запускаем немедленное воспроизведение при загрузке рекламы
  // event.preventDefault(); ???
  console.log("loading ads");

  // Инициализируtv контейнер. !!! Должно быть сделано с помощью действия пользователя на мобильных устройствах !!!
  elVideo.load();
  adDisplayContainer.initialize();

  let width = elVideo.clientWidth;
  let height = elVideo.clientHeight;



  try {
    // Инициализируйте ads manager. В это время начнется плейлист рекламы по правилам ad rules.
    adsManager.init(width, height, google.ima.ViewMode.NORMAL);  
    console.log("AdsManager started");
    // Play, чтобы начать показывать рекламу. В это время будут запущены одиночные видео-и оверлейные объявления; вызов будет проигнорирован для ad rules.
    adsManager.start();
  } catch (adError) {
    // Воспроизведение видео без рекламы, если возникает ошибка
    console.log("AdsManager could not be started");
    elVideo.play();
  }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  
  let adsRenderingSettings = new google.ima.AdsRenderingSettings();
  // Указывает, должен ли SDK восстанавливать пользовательское состояние воспроизведения после завершения рекламной паузы
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

  // Указываем elVideo, как видео контент
  adsManager = adsManagerLoadedEvent.getAdsManager(elVideo, adsRenderingSettings);


  // Добавление слушателей adsManager к необходимым событиям
  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
  adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
  adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);

}

function onAdError(adErrorEvent) {
  // Выводим ошибку и сварачиваем AdsManager.
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


// Cобытия при изменении состояния рекламного объявления и при взаимодействии пользователей с объявлением.

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

      // Скрываем панель управления плеером и лого, показываем счетчик времени
      logoIcon.style.display = 'none';
      panelControls.style.display = 'none';
      countdownUi.style.display = 'flex';
      if (ad.isLinear()) {
        // Для линейного объявления можно запускаемё таймер для опроса оставшегося времени.
        intervalTimer = setInterval(
          function () {
            let remainingTime = adsManager.getRemainingTime();
            countdownUi.innerHTML = 'Осталось: ' + parseInt(remainingTime);
          },
          300);

      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:
      // Этот ивент о завершении рекламы 
      // можно удалить элементы рекламы 
      countdownUi.style.display = 'none';
      panelControls.style.display = 'flex';
      logoIcon.style.display = 'flex';
      if (ad.isLinear()) {
        clearInterval(intervalTimer);
      }
      break;
  }
}



