/**
 * Created by home on 14-3-16.
 */

$(document).ready(function () {
	var socket = io.connect();
    var talkNews = {};
//接收聊天消息
    socket.on('selfTalk', function (data) {
        talkNews.from = data.from;
        $("#news").show();
        $("#talkCom").append("<p>" + data.from + "对你说：" + data.talk + "</p>");
    });
//发送聊天消息
    $("#talkPost").on("click", function () {
        if ($("#toName").length > 0) {
            talkNews.from = $("#toName").text();
        }
        socket.emit('selfTalk',
            {from: $("#myName").text(),
                to: talkNews.from,
                talk: $("#selfTalk").val()},
            function (info) {
                if (info == "ok") {
                    $("#talkCom").append("<p style='color:pink;'>你对" + $("#toName").text() + "说：" + $("#selfTalk").val() + "</p>");
                    $("#selfTalk").val("");
                }
            });
    });
//点击消息显示
    $("#news").on("click", function () {
        $("#news").hide();
    });
	
	// console.log("hello");
    if (typeof user != "undefined" && user != null) {
        socket.emit('online', {user: user.name});
    }
});