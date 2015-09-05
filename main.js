var map;
      DebugOverlay.prototype = new google.maps.OverlayView();

      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40.77560182201292, lng: -73.95034790039062},
          zoom: 12
        });
        
        addClickListener(map);
      }

      function display_photos(loc_info, map) {
        
        loc_info_one_array = [];
        $("#photos > .container").fadeOut('slow', function() {
          $("#photos > .container").empty();
          $.each(loc_info, function(i, v) {
            $.each(v, function(ii, vv) {
              loc_info_one_array.push(vv);  
            });
          });

          loc_info_one_array.sort(function(a, b) {
            return ((a.likes.count > b.likes.count) ? -1 : (a.likes.count < b.likes.count) ? 1 : 0);
          });

          console.log(loc_info_one_array);
          $.each(loc_info_one_array, function(i, v) {
            new DebugOverlay(calculate_bounds(v.location), "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + i + "|FE6256|000000", map);
          })
          // new DebugOverlay(calculate_bounds())
          $("#photos > .container").append(get_container(loc_info_one_array)).fadeIn();
          $(".wrapper").click(function() {
              var $this = $(this);
              window.open($this.data('link'), '_blank');
          })

        });
      }

      function get_container(loc_info_one_array) {
        console.log(loc_info_one_array);
        ret = '';
        $.each(loc_info_one_array, function(i, entry) {
          ret +=  
          '<div class="wrapper" data-link="' + entry.link + '"><div class="title"><div class="profile-picture">'
          
          + '<img src="' + entry.user.profile_picture + '"/></div><div class="from">' + entry.user.username + '</div></div><div class="photo">'
          + '<img src="' + entry.images.low_resolution.url + '"/></div><div class="metadata">'
          + '<div class="caption">';

          if (entry.caption != null) {
            ret += entry.caption.text;
          }

          ret += '</div></div></div>';
        })
        
        return ret;
      }

      function calculate_bounds(location) {
        // console.log(location.latitude, location.longitude);
        sw = new google.maps.LatLng(location.latitude - 0.001, location.longitude + 0.001);
        ne = new google.maps.LatLng(location.latitude + 0.001, location.longitude - 0.001);
        return new google.maps.LatLngBounds(sw, ne);
      }

      function addClickListener(map) {
        google.maps.event.addListener(map, 'click', function(e) {
          loc_info = [];
          $.get(
            "https://api.instagram.com/v1/locations/search?lat="
            + e.latLng.lat()
            + "&lng=" + e.latLng.lng()
            + "&access_token=50325870.c3c3973.f6ea1a578d3e44e987d5db2fcf0349da",
            function(data) {
              data_dedup = remove_duplicates(data);
              location_infos = get_location_infos(data_dedup);
              $.when.apply($, location_infos).then(function() {
                $.each(location_infos, function(idx, val) {
                  if (val.responseJSON.data.length != 0) {
                    loc_info.push(val.responseJSON.data);
                  }
                });
                display_photos(loc_info, map);
              });
            })
        });
      }

      function remove_duplicates(obj) {
        var data_dedup = [];
        var cache = {};
        for (i in obj.data) {
          var key = obj.data[i].latitude.toString();
          if (!key in cache || cache[key] != obj.data[i].longitude) {
            cache[obj.data[i].latitude] = obj.data[i].longitude;
            data_dedup.push(obj.data[i]);
          }
        }
        return data_dedup;
      }

      function get_location_infos(locs) {
        asyncs = [];
        $.each(locs, function(idx, val) {
          uri = "https://api.instagram.com/v1/locations/" + val.id + "/media/recent?access_token=50325870.c3c3973.f6ea1a578d3e44e987d5db2fcf0349da";
          asyncs.push($.get(uri));
        });
        return asyncs;
      }

      function DebugOverlay(bounds, image, map) {

      this.bounds_ = bounds;
      this.image_ = image;
      this.map_ = map;
      this.div_ = null;
      this.setMap(map);
    }

    DebugOverlay.prototype.onAdd = function() {

      var div = document.createElement('div');
      div.style.borderStyle = 'none';
      div.style.borderWidth = '0px';
      div.style.position = 'absolute';
      var img = document.createElement('img');
      img.src = this.image_;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.opacity = '0.9';
      img.style.position = 'absolute';
      div.appendChild(img);
      this.div_ = div;
      var panes = this.getPanes();
      panes.overlayLayer.appendChild(div);
    };

    DebugOverlay.prototype.draw = function() {
      var overlayProjection = this.getProjection();
      var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
      var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
      var div = this.div_;
      div.style.left = sw.x + 'px';
      div.style.top = ne.y + 'px';
      div.style.width = (ne.x - sw.x) + 'px';
      div.style.height = (sw.y - ne.y) + 'px';
    };

    DebugOverlay.prototype.updateBounds = function(bounds){
      this.bounds_ = bounds;
      this.draw();
    };

    DebugOverlay.prototype.onRemove = function() {
      this.div_.parentNode.removeChild(this.div_);
      this.div_ = null;
    };


    initMap();