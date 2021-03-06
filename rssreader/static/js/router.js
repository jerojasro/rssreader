define([
    'jquery',
    'underscore',
    'backbone',
    'mediator',
    'models/settings',
    'collections/feeds',
    'views/feeds',
    'collections/entries',
    'views/entries',
    'views/navigation',
], function($, _, Backbone, Mediator, Settings, FeedsList, FeedsView, EntriesList,
    EntriesView, NavigationView) {
    var MainRouter = Backbone.Router.extend({
        routes: {
            "": "index",
            "feeds/starred": "showStarred",
            "feeds/:id": "showFeed",
        },

        initialize: function() {
            _.bindAll(this, 'refreshPage', 'navigate');
            this.listenTo(Mediator, 'refresh', this.refreshPage);

            // Loading models and collections
            this.settings = new Settings();
            this.settings.fetch({reset: true});

            this.feeds = new FeedsList();
            this.feeds.fetch({reset: true});

            this.entries = new EntriesList();

            // Adding views
            this.feedsView = new FeedsView({
                el: $('#feeds'),
                collection: this.feeds
            });

            this.entriesView = new EntriesView({
                el: $('#entries'),
                collection: this.entries
            });

            this.navigationView = new NavigationView({
                el: $('#navigation'),
                entries: this.entries,
                settings: this.settings,
                feeds: this.feeds
            });

            (function(router) {
                $(document).on('click', 'a[href]:not([data-bypass])', function(e) {
                    var href = {prop: $(this).prop('href'), attr: $(this).attr('href')};
                    var root = location.protocol + '//' + location.host;// + app.root;
                    if (href.prop.slice(0, root.length) === root) {
                        e.preventDefault();
                        router.navigate(href.attr, true);
                    }
                });
            })(this);
        },

        refreshPage: function(options) {
            // TODO: move out to separate method?
            var settings_task = this.settings.fetch({reset: true});
            var feeds_task = this.feeds.fetch({reset: true});
            var self = this;
            $.when(settings_task, feeds_task).then(function(o, o2) {
                self.navigate(document.location.hash, options);
            });
        },

        navigate: function(fragment, options) {
            Backbone.history.fragment = null;
            Backbone.history.navigate(fragment, options);
        },

        index: function() {
            this.entries.fetch({reset: true});
        },

        showFeed: function(id) {
            this.entries.fetch({reset:true, data: {feed_id: id}});
        },

        showStarred: function() {
            this.entries.fetch({
                reset:true,
                data: {starred_only: true, show_read: true}
            });
        }
    });

    return MainRouter;
});
