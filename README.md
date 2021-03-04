<p align="center">
   <a>
    <img src="img/surfy_logo.png" width="150">
  </a>
  <h3 align="center">Player Surfy</h3>
  <p align="center">
    Видеоплеер Surfy
    <br>
</p>

## Содержание
- <a href="#documentation">Documentation</a>
- <a href="#testing">Testing</a>

## [Documentation](#documentation)
### Плеер
* [Начало](#Beginning)
  + [Управление плеером](#playerControl)
  + [Функции управления видео-контентом](#playerControlFunctions)
* [Testing](#testing)

<h3><a name="#Beginning">Начало</a></h3>
Основным рабочим файлом является ads.js в папке js. Для воспроизведения рекламы используется GOOGLE IMA SDK.

<h3><a name="#playerControl">Управление плеером</a></h3>
Основной обработчик событий window.addEventListener('load', function (event) {});. В нем содержатся обработчики, связанные с визуальным представлением плеера и обьявления элементов управления. 

```js

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

});
```
<h3><a name="#playerControlFunctions">Функции управления видео-контентом</a></h3>
Простые функции монипулирования видео-контентом: play, pause, mute, unmute.
```js
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
```

Функция перевода секунд во время.
```js
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

```

## [Testing](#Testing)
Текущая рабочая версия плеера: https://greezlyzavr.github.io/player-dev/ .


