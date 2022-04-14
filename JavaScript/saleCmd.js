//页面禁用
function disabledControls() {
    Xrm.Page.ui.controls.forEach(function (item, index) {
        try {
            //页面上 因包含明细控件可能导致脚本异常
            item.setDisabled(true);
        }
        catch {

        }
    });
}