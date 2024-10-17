// 初始化md编辑器
var maxMD;

$(function () {

    maxMD = editormd("test-maxmd", {
        width: "90%",
        height: 900,
        syncScrolling: "single",
        path: "./lib/",
        theme: "dark",
        editorTheme: "tomorrow-night-eighties",
        // 工具扩展
        toolbarHandlers: {
            color: function () {
                modal.style.display = "block";
                // 获取已保存的颜色
                let savedColors = JSON.parse(localStorage.getItem('savedColors')) || [];
                displaySavedColors(savedColors);
            },
        },
    });
});
