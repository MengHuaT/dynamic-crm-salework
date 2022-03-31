/*
 * @Author: 田孟桦
 * @Date: 2022-03-10 
 * @LastEditors: 田孟桦
 * @LastEditTime: 2022-03-14
 * @FilePath: \JavaScript\order.js
 * @Description: 客户订单
 * @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
 */


//页面加载事件
function FormOnload(executionContext) {

    let formContext = executionContext.getFormContext();

    //a.编号、原始金额、实际金额、内部客户、联系电话、收货地址字段不可编辑；
    formContext.getControl('new_number').setDisabled(true);
    formContext.getControl('new_originalamount').setDisabled(true);
    formContext.getControl('new_actualamount').setDisabled(true);
    formContext.getControl('new_internalcustomers').setDisabled(true);
    formContext.getControl('new_contactnumber').setDisabled(true);
    formContext.getControl('new_shippingaddress').setDisabled(true);
    formContext.getControl('new_orderstatus').setDisabled(true);
    var customer_id_control = formContext.getControl('new_clientid');

    //为客户搜索控件注册addPreSearch事件
    customer_id_control.addPreSearch(function () {
        CustomerAddFilter();
    });



    //将客户字段设置为不可编辑(选择订单类型后可操作)
    customer_id_control.setDisabled(true);


    //b.默认隐藏折扣和优惠额度字段(非必填)；
    formContext.getControl('new_discount').setVisible(false);
    formContext.getControl('new_preferentialamount').setVisible(false);
    Xrm.Page.getAttribute('new_discount').setRequiredLevel("none");
    Xrm.Page.getAttribute('new_preferentialamount').setRequiredLevel("none");

    //获取当前纪录主键Id
    let order_id = formContext.data.entity.getId();

    if (!order_id) {
        //产生订单编码，并赋值控件；
        let orderNumber = '';
        formContext.getAttribute('new_number').setValue(orderNumber);
    }
    else {
        //编辑时默认可以修改客户信息
        customer_id_control.setDisabled(false);
        //根据订单类型选择展示隐藏折扣或优惠额度字段；
        let discount_type = formContext.getAttribute("new_preferentialtype").getValue();

        if (discount_type === 10) {
            //显示折扣字段(必填)
            Xrm.Page.getControl('new_discount').setVisible(true);
            Xrm.Page.getAttribute('new_discount').setRequiredLevel("required");
        }
        else if (discount_type === 20) {
            //显示优惠额度字段(必填)
            Xrm.Page.getControl('new_preferentialamount').setVisible(true);
            Xrm.Page.getAttribute('new_preferentialamount').setRequiredLevel("required");
        }
        else {
            Xrm.Utility.alertDialog("请选择优惠类型");
        }
    }
}


//优惠类型更改事件函数
function DiscountTypeOnChange() {
    let discount_type = Xrm.Page.getAttribute('new_preferentialtype').getValue();




    if (discount_type === 10) {//折扣
        //显示折扣字段(必填)
        Xrm.Page.getControl('new_discount').setVisible(true);
        Xrm.Page.getAttribute('new_discount').setRequiredLevel("required");

        //隐藏优惠额度字段，清空内容(取消必填)
        Xrm.Page.getControl('new_preferentialamount').setVisible(false);
        Xrm.Page.getAttribute('new_preferentialamount').setValue(null);
        Xrm.Page.getAttribute('new_preferentialamount').setRequiredLevel("none");




    }
    else if (discount_type === 20) {//固额
        //显示优惠额度字段(必填)
        Xrm.Page.getControl('new_preferentialamount').setVisible(true);
        Xrm.Page.getAttribute('new_preferentialamount').setRequiredLevel("required");

        //隐藏折扣字段，清空内容(取消必填)
        Xrm.Page.getControl('new_discount').setVisible(false);
        Xrm.Page.getAttribute('new_discount').setValue(null);
        Xrm.Page.getAttribute('new_discount').setRequiredLevel("none");




    }
    else {
        Xrm.Utility.alertDialog("请选择优惠类型");
    }
}


//为客户字段注册CustomFilter事件: 
function CustomerAddFilter() {

    let is_internal_customer = false;
    //查询订单类型
    let order_type = Xrm.Page.getAttribute("new_type").getValue();

    //订单类型为内部订单的时候客户只能选择内部客户，正常订单需要选择非内部客户
    if (order_type) {
        is_internal_customer = order_type === 10;
    }

    if (is_internal_customer != null) {
        let fetchXml = '<filter type="and"><condition attribute="new_internalcustomers" operator="eq" value="' + is_internal_customer + '" /></filter>';
        Xrm.Page.getControl('new_clientid').addCustomFilter(fetchXml);
    }
}

//订单类型更改事件函数: 
function OrderTypeOnChange() {
    //将客户字段设置为可以更改
    Xrm.Page.getControl("new_clientid").setDisabled(false);
    //将选择客户相关属性重置
    Xrm.Page.getAttribute("new_clientid").setValue(null);
    Xrm.Page.getAttribute('new_internalcustomers').setValue(null);
    Xrm.Page.getAttribute('new_contactnumber').setValue(null);
    Xrm.Page.getAttribute('new_shippingaddress').setValue(null);

    test();
}


//客户change方法
function ClientOnChange() {
    let client_options = Xrm.Page.getAttribute('new_clientid').getValue();

    let is_internal_customer = false;
    let is_internal_customer_text = "正常客户";

    //查询订单类型
    let order_type = Xrm.Page.getAttribute("new_type").getValue();

    //订单类型为内部订单的时候客户只能选择内部客户，正常订单需要选择非内部客户
    if (order_type && order_type === 10) {
        is_internal_customer = true;
        is_internal_customer_text = "内部客户";

    }

    if (client_options) {
        var serviverUrl = Xrm.Page.context.getClientUrl();
        var parameter = "accounts?$select=new_internalcustomers,new_contactnumber,new_shippingaddress&$filter=accountid eq " + client_options[0].id;
        var req = new XMLHttpRequest();
        req.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);

        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");

        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    var results = JSON.parse(this.response);
                    Xrm.Page.getAttribute("new_internalcustomers").setValue(results.value[0].new_internalcustomers);
                    Xrm.Page.getAttribute("new_contactnumber").setValue(results.value[0].new_contactnumber);
                    Xrm.Page.getAttribute("new_shippingaddress").setValue(results.value[0].new_shippingaddress);

                    //判断选择的客户是否满足订单类型匹配的条件
                    if (is_internal_customer != results.value[0].new_internalcustomers) {
                        //情况客户信息，弹出对话框
                        Xrm.Page.getAttribute("new_clientid").setValue(null);
                        Xrm.Page.getAttribute('new_internalcustomers').setValue(null);
                        Xrm.Page.getAttribute('new_contactnumber').setValue(null);
                        Xrm.Page.getAttribute('new_shippingaddress').setValue(null);
                        Xrm.Utility.alertDialog("您只能选择[" + is_internal_customer_text + "]");


                    }

                } else {
                    alert(this.statusText);
                }
                //}
            };

        }
        req.send();
    }
}


//确认按钮点击事件函数: 
function ConformOnClick() {
    //订单状态改为已确认
    Xrm.Page.getAttribute('new_orderstatus').setValue(20);
    Xrm.Page.data.save().then(function () { parent.window.location.reload(); });
}

/**
 * 退单按钮点击事件函数: 
 * @param {*}
 * @return {*}
 */
function RefundOnClick() {
    ////订单状态改为已退单
    Xrm.Page.getAttribute('new_orderstatus').setValue(30);
    Xrm.Page.data.save().then(function () { parent.window.location.reload(); });
}


/**
 * 确认订单显示隐藏事件函数: 
 * @param {*}
 * @return {*}
 */
function ConformDisplay() {
    console.log("确认订单显示隐藏测试");
    let order_status = Xrm.Page.getAttribute("new_orderstatus").getValue();
    return order_status === 10;
}

/**
 * 订单退单显示隐藏事件函数: 
 * @param {*}
 * @return {*}
 */
function RefundDisplay() {
    console.log("订单退单显示隐藏测试");
    let order_status = Xrm.Page.getAttribute("new_orderstatus").getValue();
    return order_status === 20;
}


/**
 * 点击保存事件函数: 
 * @param {*} executionContext 窗体上下文对象
 * @return {*}
 */
function FormOnSave(executionContext) {
    debugger
    var formContext = executionContext.getFormContext();
    let discount_type = formContext.getAttribute('new_preferentialtype').getValue();
    var preferentialamount = Xrm.Page.getAttribute("new_preferentialamount").getValue();//优惠额度
    var discount = Xrm.Page.getAttribute("new_discount").getValue();//折扣
    var originalamount = Xrm.Page.getAttribute("new_originalamount").getValue();//原始金额


    let go_next_step = true;

    if (discount_type === 10) {//折扣
        let discount = formContext.getAttribute('new_discount').getValue();
        if (!discount) {
            go_next_step = false;
            Xrm.Utility.alertDialog("优惠类型为折扣时，折扣字段必填");
        }


        var actualamount = parseFloat(originalamount) * parseFloat(discount);//实际金额
        if (actualamount > 0)
            Xrm.Page.getAttribute("new_actualamount").setValue(actualamount);
        else if (originalamount > 0) {
            go_next_step = false;
            alert("异常金额！")
        }
    }
    else if (discount_type === 20) {//固额
        let discount_amount = formContext.getAttribute('new_preferentialamount').getValue();
        if (!discount_amount) {
            go_next_step = false;
            Xrm.Utility.alertDialog("优惠类型为固额时，优惠额度字段必填");
        }


        var actualamount = parseFloat(originalamount) - parseFloat(preferentialamount);//实际金额
        if (actualamount > 0)
            Xrm.Page.getAttribute("new_actualamount").setValue(actualamount);
        else if (originalamount > 0) {
            go_next_step = false;
            alert("异常金额！")
        }
    }
    else {
        go_next_step = false;
        Xrm.Utility.alertDialog("请选择优惠类型");
    }


    //查询客户额度
    let client_options = Xrm.Page.getAttribute('new_clientid').getValue();
    var serviverUrl = Xrm.Page.context.getClientUrl();
    var parameter = "accounts?$select=new_accountquota&$filter=accountid eq " + client_options[0].id;
    var req = new XMLHttpRequest();
    req.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);

    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json;charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");

    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status == 200) {
                var results = JSON.parse(this.response);
                var new_accountquota = results.value[0].new_accountquota;//当前客户额度
                if (actualamount > new_accountquota && formContext.getAttribute('new_orderstatus').getValue() == 20) {
                    go_next_step = false;
                    Xrm.Page.getAttribute("new_orderstatus").setValue(10);
                    alert("订单金额" + actualamount + "大于客户额度" + new_accountquota)

                }
            } else {
                alert(this.statusText);
            }
            //}
        };

    }
    req.send();




    if (!go_next_step) {
        //终止提交
        executionContext.getEventArgs().preventDefault();
    }
}



function test() {
    debugger
    var entity = new Object();
    entity["actionName"] = 'lisi';
    entity["input"] = '123';
    var req = new XMLHttpRequest()
    req.open("post", "http://192.168.153.128:5555/Demo/api/data/v9.1/new_demo", false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("crossDomain", "true");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");

    req.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var result = JSON.parse(this.responseText);
                alert(this.responseText);
            }
            else {

            }
        }
    };
    req.send(JSON.stringify(entity))
}





