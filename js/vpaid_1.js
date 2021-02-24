var VpaidVideoPlayer = function() {
    this.slot_ = null;
    this.eventsCallbacks_ = {};
    this.attributes_ = {
        'companions' : '',
        'desiredBitrate' : 256,
        'duration' : 30,
        'expanded' : false,
        'height' : 0,
        'icons' : '',
        'linear' : true,
        'remainingTime' : 10,
        'skippableState' : false,
        'viewMode' : 'normal',
        'width' : 0,
        'volume' : 1.0
    };
    this.quartileEvents_ = [
        {event: 'AdVideoStart', value: 0},
        {event: 'AdVideoFirstQuartile', value: 25},
        {event: 'AdVideoMidpoint', value: 50},
        {event: 'AdVideoThirdQuartile', value: 75},
        {event: 'AdVideoComplete', value: 100}
    ];
    this.lastQuartileIndex_ = 0;
    this.parameters_ = {};
    this.vast_ = null;
    this.ad_ = {};
    this.adVideo_ = {
        adDisplayContainer: null,
        adsLoader: null,
        adsRequest: null,
        adsManager: null,
        init: () => {
            this.log('adVideo_.init start');

            let head = document.getElementsByTagName('head')[0];
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//imasdk.googleapis.com/js/sdkloader/ima3.js';
            script.onload = () => {

                this.adVideo_.adDisplayContainer_ =
                    new google.ima.AdDisplayContainer(
                        this.slot_);
                this.adVideo_.adDisplayContainer_.initialize();

                google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED);

                this.adVideo_.adsLoader = new google.ima.AdsLoader(this.adVideo_.adDisplayContainer_);
                this.adVideo_.adsLoader.addEventListener(
                    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                    this.adVideo_.onAdsManagerLoaded,
                    false);
                this.adVideo_.adsLoader.addEventListener(
                    google.ima.AdErrorEvent.Type.AD_ERROR,
                    this.adVideo_.onAdError,
                    false);

                this.adVideo_.adsRequest = new google.ima.AdsRequest();
                this.adVideo_.adsRequest.adsResponse = this.vast_;
                this.adVideo_.adsRequest.linearAdSlotWidth = this.attributes_['width'];
                this.adVideo_.adsRequest.linearAdSlotHeight = this.attributes_['height'];

                this.adVideo_.adsLoader.requestAds(this.adVideo_.adsRequest);
            };
            head.appendChild(script);

            this.log('adVideo_.init end');
        },
        onAdsManagerLoaded: (adsManagerLoadedEvent) => {
            this.log('adVideo_.onAdsManagerLoaded start');

            let setting = new google.ima.AdsRenderingSettings();
            setting.loadVideoTimeout = 30000;
            setting.uiElements = [];

            this.adVideo_.adsManager = adsManagerLoadedEvent.getAdsManager({}, setting);

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.COMPLETE,
                this.adVideo_.onAdCompleted);
            this.adVideo_.adsManager.addEventListener(
                google.ima.AdErrorEvent.Type.AD_ERROR,
                this.adVideo_.onAdError);

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.STARTED,
                () => this.callEvent_('AdVideoStart')
            );

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.IMPRESSION,
                () => this.callEvent_('AdImpression')
            );

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.FIRST_QUARTILE,
                () => this.callEvent_('AdVideoFirstQuartile')
            );

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.MIDPOINT,
                () => this.callEvent_('AdVideoMidpoint')
            );

            this.adVideo_.adsManager.addEventListener(
                google.ima.AdEvent.Type.THIRD_QUARTILE,
                () => this.callEvent_('AdVideoThirdQuartile')
            );

            // this.adVideo_.adsManager.addEventListener(
            //     google.ima.AdEvent.Type.THIRD_QUARTILE,
            //     () => this.callEvent_('AdVideoThirdQuartile')
            // );

            this.callEvent_('AdLoaded');
            this.log('adVideo_.onAdsManagerLoaded end');
        },
        onAdError: (adErrorEvent) => {
            this.log('adVideo_.onAdError start');
            this.log(adErrorEvent.getError());
            this.adVideo_.adsManager.destroy();
            this.log('adVideo_.onAdError end')
        },
        onAdCompleted: () => {
            this.log('adVideo_.onAdCompeted start');
            this.adVideo_.adsManager.destroy();
            // this.callEvent_('AdSkipped');
            this.callEvent_('AdVideoComplete');
            this.callEvent_('AdStopped');
            this.log('adVideo_.onAdCompeted end');
        },
        startAd: () => {
            this.adVideo_.adsManager.setVolume(0);
            this.adVideo_.adsManager.init(this.attributes_['width'], this.attributes_['height'], google.ima.ViewMode.NORMAL);
            this.adVideo_.adsManager.start();
        },
        pauseAd: () => {
            this.adVideo_.adsManager.pause();
        },
        resumeAd: () => {
            this.adVideo_.adsManager.resume();
        },
        setVolume: (value) => {
            this.adVideo_.adsManager.setVolume(value);
        },
        resize: (width, height, viewMode) => {
            this.adVideo_.adsManager.resize(width, height, viewMode)
        }
    };
};

VpaidVideoPlayer.prototype.initAd = function(
    width,
    height,
    viewMode,
    desiredBitrate,
    creativeData,
    environmentVars) {
    this.log('initAd start');

    width = Math.round(width);
    height = Math.round(height);

    // slot and videoSlot are passed as part of the environmentVars
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;
    this.attributes_['desiredBitrate'] = desiredBitrate;
    this.slot_ = environmentVars.slot;

    let domain = '';
    if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
        domain = window.location.ancestorOrigins.item(window.location.ancestorOrigins.length - 1);

    }
    domain = domain.replace(/(^\w+:|^)\/\//, '');
    domain = domain === '' ? 'test.domain' : domain;

    // Parse the incoming parameters.
    this.parameters_ = JSON.parse(creativeData['AdParameters']);

    this.parameters_.url = this.parameters_.url.replace('{WIDTH}', width.toString());
    this.parameters_.url = this.parameters_.url.replace('{HEIGHT}', height.toString());
    this.parameters_.url = this.parameters_.url.replace('{DOMAIN}', domain);
    this.parameters_.url = this.parameters_.url.replace('{UA}', encodeURIComponent(navigator.userAgent));

    fetch(this.parameters_.url)
        .then(res => {
            res.text()
                .then(res => {
                    this.vast_ = res;
                    this.adVideo_.init();
                    this.ad_ = this.adVideo_;
                })
        })
        .catch(() => this.callEvent_('AdSkipped'));

    this.log('initAd end');
};

VpaidVideoPlayer.prototype.overlayOnClick_ = function() {
    this.callEvent_('AdClickThru');
};

VpaidVideoPlayer.prototype.handshakeVersion = function(version) {
    return ('2.0');
};

VpaidVideoPlayer.prototype.startAd = function() {
    this.log('startAd start');
    this.ad_.startAd();
    this.callEvent_('AdStarted');
    this.log('startAd end');
};

VpaidVideoPlayer.prototype.stopAd = function() {
    this.log('stopAd start');
    this.callEvent_('AdStopped');
    this.log('stopAd end');
};

VpaidVideoPlayer.prototype.setAdVolume = function(value) {
    this.attributes_['volume'] = value;
    this.log('setAdVolume ' + value);
    this.ad_.setVolume(value);
    this.callEvent_('AdVolumeChange');
};

VpaidVideoPlayer.prototype.getAdVolume = function() {
    this.log('getAdVolume');
    return this.attributes_['volume'];
};

VpaidVideoPlayer.prototype.resizeAd = function(width, height, viewMode) {
    this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode);
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;
    this.ad_.resize(width, height, viewMode);
    this.callEvent_('AdSizeChange');
};

VpaidVideoPlayer.prototype.pauseAd = function() {
    this.log('pauseAd');
    this.ad_.pauseAd();
    this.callEvent_('AdPaused');
};

VpaidVideoPlayer.prototype.resumeAd = function() {
    this.log('resumeAd');
    this.ad_.resumeAd();
    this.callEvent_('AdPlaying');
};

VpaidVideoPlayer.prototype.expandAd = function() {
    this.log('expandAd');
    this.attributes_['expanded'] = true;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    }
    this.callEvent_('AdExpanded');
};

VpaidVideoPlayer.prototype.getAdExpanded = function() {
    this.log('getAdExpanded');
    return this.attributes_['expanded'];
};

VpaidVideoPlayer.prototype.getAdSkippableState = function() {
    this.log('getAdSkippableState');
    return this.attributes_['skippableState'];
};

VpaidVideoPlayer.prototype.collapseAd = function() {
    this.log('collapseAd');
    this.attributes_['expanded'] = false;
};

VpaidVideoPlayer.prototype.skipAd = function() {
    this.log('skipAd');
    this.ad_.onAdCompleted();
};

VpaidVideoPlayer.prototype.subscribe = function(
    aCallback,
    eventName,
    aContext) {
    this.log('Subscribe ' + aCallback);
    var callBack = aCallback.bind(aContext);
    this.eventsCallbacks_[eventName] = callBack;
};

VpaidVideoPlayer.prototype.unsubscribe = function(eventName) {
    this.log('unsubscribe ' + eventName);
    this.eventsCallbacks_[eventName] = null;
};

VpaidVideoPlayer.prototype.getAdWidth = function() {
    return this.attributes_['width'];
};

VpaidVideoPlayer.prototype.getAdHeight = function() {
    return this.attributes_['height'];
};

VpaidVideoPlayer.prototype.getAdRemainingTime = function() {
    return this.attributes_['remainingTime'];
};

VpaidVideoPlayer.prototype.getAdDuration = function() {
    return this.attributes_['duration'];
};

VpaidVideoPlayer.prototype.getAdCompanions = function() {
    return this.attributes_['companions'];
};

VpaidVideoPlayer.prototype.getAdIcons = function() {
    return this.attributes_['icons'];
};

VpaidVideoPlayer.prototype.getAdLinear = function() {
    return this.attributes_['linear'];
};

VpaidVideoPlayer.prototype.log = function(message) {
    console.log(message);
};

VpaidVideoPlayer.prototype.callEvent_ = function(eventType) {
    if (eventType in this.eventsCallbacks_) {
        this.eventsCallbacks_[eventType]();
        // console.log(eventType)
    }
};

VpaidVideoPlayer.prototype.muteButtonOnClick_ = function() {
    if (this.attributes_['volume'] == 0) {
        this.attributes_['volume'] = 1.0;
    } else {
        this.attributes_['volume'] = 0.0;
    }
    this.callEvent_('AdVolumeChange');
};

var getVPAIDAd = function() {
    return new VpaidVideoPlayer();
};