/* 
 *  Entwicklungsprojekt interaktive Systeme
 *  Wintersemester 2014/15
 * 
 *  PLAY ON DELAY
 *  Proof of Concepts
 * 
 */

var express = require('express');
var http = require('http');
var mongoDB = require('mongoskin');
var db = mongoDB.db('mongodb://localhost/mydb?auto_reconnect=true', {
     safe: true
});
var app = express();
var server = http.createServer(app);
var gcm = require('node-gcm');

db.bind("pod_activities");
var db_pod_activities = db.pod_activities ;

var user_lat = 50.941150260423946;
var user_lon = 6.97575643658638;
var user_timewindow = 60;

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.json());
    app.use(express.urlencoded());

    app.use(function(err, req, res, next){
       console.error(err.stack);
       res.end(err.status + '' + err.messages);
    });
    
    function aproxDistance(lat1, lon1, lat2, lon2){
        if (typeof(Number.prototype.toRad) === "undefined") {
                Number.prototype.toRad = function() {
                return this * Math.PI / 180;
                }
        }
        
        lat1 = lat1 *1;
        lon1 = lon1 *1;
        lat2 = lat2 *1;
        lon2 = lon2 *1;
        temp1 = lat2-lat1;
        temp2 = lon2-lon1;
        var R = 6371; // km
        var dLat = temp1.toRad();
        var dLon = temp2.toRad();
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
    
        final = d * 1000;
        return final;
    }
    
    getPossibleActivities();
    function getPossibleActivities(){
        getActivities(function(object){
            var activities = object;
            for (var i = 0; i < activities.length; i++) {
              if(aproxDistance(user_lat, user_lon, activities[i].Lat, activities[i].Lon) <= 5000 ){
                  rateActivity(activities[i]);
              }
            }         
        });   
    } 
    
    function getActivities(cb){
        db_pod_activities.findItems(function(error, result){
            if(error){
                next(error);
            }
            else{
                cb(result);
            }
        });
    }  
    
    function rateActivity(activity){
            var user_timetoactivity = Math.floor((Math.random() * 10) + 1);
            var weather_rating = 0;
            var timeto_rating = 0;
            var overall_rating =0;
            
            timeto_rating = user_timetoactivity*2/user_timewindow*100;
    
    
            url = "http://api.openweathermap.org/data/2.5/weather?lat=" + activity.Lat + "&lon=" + activity.Lon + "&units=metric"
            var request = http.get(url, function(response){
                var buffer = "", data;
                response.on("data", function(chunk){
                    buffer += chunk;
                });
                response.on("end", function(err){
                    data = JSON.parse(buffer);
                    //weather condition code, first digit == 5 -> rainy, see http://openweathermap.org/weather-conditions for more information
                    weather_id = data.weather[0].id;
                    switch(weather_id) {
                        case 800:
                        case 951:
                        case 952:
                        case 953:
                            weather_rating = 100;
                            break;
                        case 954:
                        case 800:
                        case 801:
                        case 802:
                        case 803:
                        case 804:
                        case 954:
                            weather_rating = 90;
                            break;
                        case 955:
                            weather_rating = 80;
                            break;
                        case 600:
                        case 601:
                        case 602:
                        case 611:
                        case 612:
                        case 615:
                        case 616:
                        case 620:
                        case 621:
                        case 622:
                            weather_rating = 70;
                            break;
                        case 300:
                        case 301:
                        case 302:
                        case 310:
                        case 311:
                        case 312:
                        case 313:
                        case 314:
                        case 321:
                            weather_rating = 60;
                            break;
                        case 956:
                            weather_rating = 50;
                            break;
                        case 957:
                        case 500:
                        case 501:
                        case 502:
                        case 503:
                        case 504:
                        case 511:
                        case 520:
                        case 521:
                        case 522:
                        case 531:
                            weather_rating = 40;
                            break;
                        case 958:
                            weather_rating = 30;
                            break;
                        case 959:
                        case 701:
                        case 711:
                        case 721:
                        case 731:
                        case 741:
                        case 751:
                        case 761:
                        case 762:
                        case 771:
                        case 781:
                            weather_rating = 20;
                            break;
                        case 960:
                        case 200:
                        case 201:
                        case 202:
                        case 210:
                        case 211:
                        case 212:
                        case 221:
                        case 230:
                        case 231:
                        case 232:
                            weather_rating = 10;
                            break;
                        case 900:
                        case 901:
                        case 902:
                        case 903:
                        case 904:
                        case 905:
                        case 906:
                        case 961:
                        case 962:
                            weather_rating = 0;
                            break;
                        default:
                            weather_rating = 50;
                    }
                    overall_rating = timeto_rating+weather_rating/2;
                    console.log("Die Aktivitaet '" + activity.name + "' wurde mit " + Math.round(overall_rating) + " Punkten bewertet.");
                });
            });
           
    }
        
   
    function pushNotification(){
          var message = new gcm.Message();
          var sender = new gcm.Sender('AIzaSyCBplmIZIOlxF-F04O1lP4L7IhDPG9YJ98');
          var registrationIds = [];
          registrationIds.push('regId1');
          sender.sendNoRetry(message, registrationIds, function (err, result) {
            console.log(result);
          });
    }

    //getWeather(user_lat, user_lon);
    //pushNotification();

});



server.listen(80, function(){
    console.log('Server running...');
}); 