/**
 * [kevcar]
 *
 * @version: 0.0.1
 * @author: [author]
 * @description [description]
 *
 * [license]
 */


/**
 * Custom Application
 */

CustomApplicationsHandler.register("app.kevcar", new CustomApplication({

	/**
	 * (require)
	 *
	 * An object array that defines resources to be loaded such as javascript's, css's, images, etc
	 *
	 * All resources are relative to the applications root path
	 */

	require: {

		/**
		 * (js) defines javascript includes
		 */

		js: ['Chart.min.js'],

		/**
		 * (css) defines css includes
		 */

		css: ['app.css'],

		/**
		 * (images) defines images that are being preloaded
		 *
		 * Images are assigned to an id, e.g. {coolBackground: 'images/cool-background.png'}
		 */

		images: {
			appPNG: 'app.png'

		},
	},

	/**
	 * (settings)
	 *
	 * An object that defines application settings
	 */

	settings: {

		/**
		 * (title) The title of the application in the Application menu
		 */

		title: 'KevCar',

		/**
		 * (statusbar) Defines if the statusbar should be shown
		 */

		statusbar: true,

		/**
		 * (statusbarIcon) defines the status bar icon
		 *
		 * Set to true to display the default icon app.png or set a string to display
		 * a fully custom icon.
		 *
		 * Icons need to be 37x37
		 */

		statusbarIcon: true,

		/**
		 * (statusbarTitle) overrides the statusbar title, otherwise title is used
		 */

		statusbarTitle: false,

		/**
		 * (statusbarHideHomeButton) hides the home button in the statusbar
		 */

		// statusbarHideHomeButton: false,

		/**
		 * (hasLeftButton) indicates if the UI left button / return button should be shown
		 */

		hasLeftButton: false,

		/**
		 * (hasMenuCaret) indicates if the menu item should be displayed with an caret
		 */

		hasMenuCaret: false,

		/**
		 * (hasRightArc) indicates if the standard right arc should be displayed
		 */

		hasRightArc: false,

	},


	/******************************
	* INITIALIZE GLOBAL VARIABLES
	******************************/
	lineChart: function() { },
	isChartInitialized: false,
	chartStartTime: {},
	maxElapsedChartTimeMinutes: 15,
	chartUpdateRate: 5000,
	currentSpeed: 0,
	averageConsumption: 0,


	/***
	 *** Application Life Cycles
	 ***/

	/**
	 * (created)
	 *
	 * Executed when the application is initialized for the first time. Once an application is
	 * initialized it always keeps it's current state even the application is not displayed.
	 *
	 * Usually you want to initialize your user interface here and generate all required DOM Elements.
	 *
	 *
	 * @event
	 * @return {void}
	 */

	created: function() {
		this.speedChart = $("<canvas/>").attr({id: "speedChart", width: '775', height: '400px'})

		this.chartStartTime = Date.now();
	},


	setDataSubscriptions: function() {
		this.subscribe(VehicleData.vehicle.speed, function(speed) {
			this.currentSpeed = speed;
		}.bind(this));

		this.subscribe(VehicleData.fuel.averageconsumption, function(consumption) {
			this.averageConsumption = consumption;
		}.bind(this));

	},
	/**
	 * (focused)
	 *
	 * Executes when the application gets displayed on the Infotainment display.
	 *
	 * You normally want to start your application workflow from here and also recover the app from any
	 * previous state.
	 *
	 * @event
	 * @return {void}
	 */
	focused: function() {
		this.initializeChart();
		this.updateChart();
	},

	initializeChart: function() {
		this.drawTimer = setInterval(function() {
			this.drawChart();
			this.isChartInitialized = true;
			clearInterval(this.drawTimer);
		}.bind(this), 1000);
	},

	drawChart: function() {
		if (!this.isChartInitialized) {
			this.log.info("Drawing chart...");

			// Set update timer
			this.updateChart();

			this.canvas.append(this.speedChart)
			var canvas = this.speedChart.get(0),
			ctx = canvas.getContext('2d');

			var data = {
				labels: [""],
				datasets: [
					{
						label: "Speed",
						fillColor: "rgba(220,220,220,0.2)",
						strokeColor: "rgba(220,220,220,1)",
						pointColor: "rgba(220,220,220,1)",
						pointStrokeColor: "#fff",
						pointHighlightFill: "#fff",
						pointHighlightStroke: "rgba(220,220,220,1)",
						data: [0]
					},
					{
						label: "Fuel Consumption",
						fillColor: "rgba(220,120,220,0.2)",
						strokeColor: "rgba(220,120,220,1)",
						pointColor: "rgba(220,220,220,1)",
						pointStrokeColor: "#fff",
						pointHighlightFill: "#fff",
						pointHighlightStroke: "rgba(220,220,220,1)",
						data: [0]
					}
				]
			};

			var options = {
				showTooltips: false,
				scaleShowGridLines: true,
				scaleShowHorizontalLines: true,
				segmentShowStroke : true,
				pointDot : false,
			};
			this.lineChart = new Chart(ctx).Line(data, options);
		}
	},

	updateChart: function() {
		this.updateTimer = setInterval(function() {
			var elapsedTime = Date.now() - this.chartStartTime;
			if ((elapsedTime / 1000 / 60) > this.maxElapsedChartTimeMinutes) {
				this.log.info("Removing data");
				this.lineChart.removeData();
			}

			this.log.info("Updating chart... " + elapsedTime / 1000 / 60);
			this.lineChart.addData([this.currentSpeed, this.averageConsumption], "");
		}.bind(this), this.chartUpdateRate);
	},

	/**
	 * (lost)
	 *
	 * Lost is executed when the application is being hidden.
	 *
	 * Usually you want to add logic here that stops your application workflow and save any values that
	 * your application may require once the focus is regained.
	 *
	 * @event
	 * @return {void}
	 */

	lost: function() {
		clearInterval(this.updateTimer)
		clearInterval(this.speedTimer)
	},


	/**
	 * (terminated)
	 *
	 * Usually you never implement this lifecycle event. Your custom application stays alive and keeps it's
	 * state during the entire runtime of when you turn on your Infotainment until you turn it off.
	 *
	 * This has two advantages: First all of your resources (images, css, videos, etc) all need to be loaded only
	 * once and second while you wander through different applications like the audio player, your application
	 * never needs to be reinitialized and is just effectivily paused when it doesn't have the focus.
	 *
	 * However there are reasons, which I can't think any off, that your application might need to be
	 * terminated after each lost lifecyle. You need to add {terminateOnLost: true} to your application settings
	 * to enable this feature.
	 *
	 * @event
	 * @return {void}
	 */

	terminated: function() {

	},


	/***
	 *** Application Events
	 ***/


    /**
     * (event) onContextEvent
     *
     * Called when the context of an element was changed
     *
     * The eventId might be either FOCUSED or LOST. If FOCUSED, the element has received the
     * current context and if LOST, the element's context was removed.
     *
     * @event
     * @param {string} eventId - The eventId of this event
     * @param {object} context - The context of this element which defines the behavior and bounding box
     * @param {JQueryElement} element - The JQuery DOM node that was assigned to this context
     * @return {void}
     */

    onContextEvent: function(eventId, context, element) {

        switch(eventId) {

        	/**
        	 * The element received the focus of the current context
        	 */

        	case this.FOCUSED:

        		break;

        	/**
        	 * The element lost the focus
        	 */

        	case this.LOST:

        		break;
        }

    },

	/**
	 * (event) onControllerEvent
	 *
	 * Called when a new (multi)controller event is available
	 *
	 * @event
	 * @param {string} eventId - The Multicontroller event id
	 * @return {void}
	 */

	onControllerEvent: function(eventId) {

		switch(eventId) {

			/*
			 * MultiController was moved to the left
			 */
			case this.LEFT:

				break;

			/*
			 * MultiController was moved to the right
			 */
			case this.RIGHT:

				break;

			/*
			 * MultiController was moved up
			 */
			case this.UP:

				break;

			/*
			 * MultiController was moved down
			 */
			case this.DOWN:

				break;

			/*
			 * MultiController Wheel was turned clockwise
			 */
			case this.CW:

				break;

			/*
			 * MultiController Wheel was turned counter-clockwise
			 */
			case this.CCW:

				break;

			/*
			 * MultiController's center was pushed down
			 */
			case this.SELECT:

				break;

			/*
			 * MultiController hot key "back" was pushed
			 */
			case this.BACK:

				break;
		}

	},


})); /** EOF **/
