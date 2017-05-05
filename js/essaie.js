console.log("hohihihihihi");
$(document).ready(function()
{
	var len = 0;
    var curStart = 0;
    var count = 5;
    var items=new Array();
    function BackupList() {
        var lst = $("ul#list");
        len= $("ul#list li").length;
        if (len <= count)
            return;

        $("ul#list li").each(function() {
            items.push($(this));
            $(this).remove();
        });

        var html="";
        for (curStart; curStart < count && curStart < len; curStart++) {
            html += "<li>" + $(items[curStart]).html() + "</li>";
        }
        $(html).appendTo($(lst));
    }

    function ShowMore() {
        if (curStart >= len) {
            curStart = 0;
        }

        $("ul#list li").each(function() {
            $(this).remove();
        });

        var l = curStart;
        var html = "";
        for (curStart; curStart < (l + count) && curStart < len; curStart++) {
            html += "<li>" + items[curStart].html() + "</li>";
        }
        $(html).appendTo($("ul#list"));
    }
});
