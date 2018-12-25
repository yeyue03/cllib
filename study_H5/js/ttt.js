<script type="text/javascript">
    function initTable() {
        //先销毁表格
        $('#cusTable').bootstrapTable('destroy');
        //初始化表格,动态从服务器加载数据
        $("#cusTable").bootstrapTable({
            method: "get",  //使用get请求到服务器获取数据
            url: "/admin/card/index.html", //获取数据的地址
            striped: true,  //表格显示条纹
            pagination: true, //启动分页
            pageSize: 20,  //每页显示的记录数
            pageNumber:1, //当前第几页
            pageList: [5, 10, 15, 20, 25],  //记录数可选列表
            sidePagination: "server", //表示服务端请求
            paginationFirstText: "首页",
            paginationPreText: "上一页",
            paginationNextText: "下一页",
            paginationLastText: "尾页",
            queryParamsType : "undefined",
            sortable: true,                     //是否启用排序
            sortName:'addTime',
            sortOrder: 'desc',
            queryParams: function queryParams(params) {   //设置查询参数
                var param = {
                    pageNumber: params.pageNumber,
                    pageSize: params.pageSize,
                    cardNo:$('#cardNo').val(),
                    status:$('#status').val(),
                    sort:params.sortName,
                    sortOrder:params.sortOrder,
                };
                return param;
            },
            onLoadSuccess: function(res){  //加载成功时执行
                if(111 == res.code){
                    window.location.reload();
                }
                layer.msg("加载成功", {time : 1000});
            },
            onLoadError: function(){  //加载失败时执行
                layer.msg("加载数据失败");
            },

            /*columns:[
                //{field: 'id',title: 'ID',formatter: formatterIndex},
                {field: 'state',title: 'state'},
                {field: 'id',title: 'ID'},
                {field: 'cardNo',title: '卡号'},
                {
                    title: '操作',
                    field: 'operate',
                    formatter: formatterOperate
                },
            ],*/
        });
    }

    function cardNoHandle(value, row, index) {
        var new_card_value = row.cardNo.replace(/\s/g,'').replace(/(\d{4})(?=\d)/g,"$1 ");
        return new_card_value;
    }

    function formatterOperate(value, row){
        //return "<button onclick='editRow("+id+")' class='btn small blue'><i class='fa fa-edit'></i> 购买</button>";
        return "<input type='number' name='"+row.id+"'>";
    }


    //给公司赋值id属性
    function companyEvent(value, row, index) {
        return "<span companyId="+row.companyId+">" + value + "</span>";
    }


    $(document).ready(function () {
        //调用函数，初始化表格
        initTable();

        //当点击查询按钮的时候执行
        $("#search").bind("click", initTable);

        //卡充值
        $("#card_buy").bind("click", function() {
            var _this = $(this);
            _this.attr('disabled', true);

            //获取折扣率
            var discount = $("#discount").val();
            if(discount == 0) {
                discount = 100;
            }

            //判断是否选中卡片
            var ids = '';
            var moneyStr = '';
            var need_param_arr = new Array();
            var total_origin_money = 0;
            var total_discount_money = 0;
            var total_money = 0;
            $.each($('input[name="btSelectItem"]:checkbox:checked'),function(i,v){
                var _this = $(this);
                //获取选中的id
                var curr_id = _this.parent().parent().find('td').eq(1).html();
                ids += curr_id + ',';

                //所属公司id
                var curr_company_id = _this.parent().parent().find('td').eq(3).find('span').attr('companyId');

                //获取输入的充值金额
                var curr_last_second_td = _this.parent().parent().find('td').eq(-2);  //倒数第二个td
                var curr_money = curr_last_second_td.find('input').val();
                moneyStr += curr_money + ',';
                total_origin_money += Number(curr_money);
                total_money += Number(curr_money * discount/100);

                //获取卡号码
                var curr_card_no = _this.parent().parent().find('td').eq(2).html();

                curr_obj = {'cardId':curr_id, 'cardNo':curr_card_no, 'rechargeAmount':curr_money, 'companyId':curr_company_id};
                need_param_arr.push(curr_obj);

            });

            if(ids == '') {
                layer.alert('请选择要充值的卡', {title: '友情提示', icon: 2});
                _this.attr('disabled', false);
                return;
            }
            if(moneyStr == '') {
                layer.alert('请为选择的卡填写充值金额!', {title: '友情提示', icon: 2});
                _this.attr('disabled', false);
                return;
            }

            var agent_id = $("#agent_id").val();
            if(!agent_id) {
                layer.alert('非法请求', {title: '友情提示', icon: 2});
                _this.attr('disabled', false);
                return;
            }


            total_discount_money = (total_origin_money - total_money).toFixed(2);
            total_origin_money = total_origin_money.toFixed(2);
            total_money = total_money.toFixed(2);
            var confirm_msg = '确认要给选中的卡片充值吗? 优惠前金额：'+total_origin_money+'元, 优惠后金额：'+total_money+'元, 折扣'+discount+'%';
            layer.confirm(confirm_msg, {icon: 3, title:'提示'}, function(index){
                //加载层
                //loading层
                var load_flag = layer.load(1, {
                    shade: [0.1,'#fff'] //0.1透明度的白色背景
                });


                allotData = {
                    //'card_buy_check_ids' : ids,
                    //'card_buy_money' : moneyStr,
                    'need_param_arr' : need_param_arr,
                    'agent_id' : agent_id,
                };
                $.getJSON("/admin/orders/orderadd.html", allotData, function(res){

                    if(1 == res.code){
                        layer.close(load_flag);
                        layer.alert(res.msg, {title: '友情提示', icon: 1, closeBtn: 0}, function(){
                            initTable();
                        });
                    }else if(111 == res.code){
                        layer.close(load_flag);
                        window.location.reload();
                    }else if(res.code == -3) {
                        layer.alert(res.msg, {title: '友情提示', icon: 2, closeBtn: 0}, function(){
                            if(res.data) {
                                window.location.href = res.data;
                            }
                        });
                    }else{
                        layer.close(load_flag);
                        layer.alert(res.msg, {title: '友情提示', icon: 2});
                        _this.attr('disabled', false)
                    }
                });
                layer.close(index)
            })

            _this.attr('disabled', false)
        })
    
    });

</script> 

////点击选中 star ===================================
//<script type = "text/javascript" >
//	//	选中复选框存入数组 star
//	var cid_arr = new Array();
//	$(document).ready(function() {
//		$("input[name='btSelectItem']").off("click").on("click", function() {
//			var _cid = $(this).parent().next().html();
//			if(this.checked) {
//				cid_arr.push(_cid);
//			} else {
//				cid_arr.splice($.inArray(_cid, cid_arr), 1);
//			}
//			console.log(cid_arr);
//		})
//		$("input[name='btSelectAll']").off("click").on("click", function() {
//			alert("all");
//			var that = this;
//			$.each($("input[name='btSelectItem']"), function(i, item) {
//				var _cid = $(this).parent().next().html();
//				if (that.checked) {
//					if($.inArray(_cid, cid_arr) == -1 && cid_arr.length != 0) {
//						cid_arr.push(_cid);
//					}
//				} else {
//					cid_arr.splice($.inArray(_cid, cid_arr), 1);
//				}
//			})
//			console.log(cid_arr);
//		})
//		
//		$(".page-number").bind("click", function() {
//			var _page = $(this).children().html();
//			alert(_page);
//		})
//	});
////  选中复选框存入数组 end
////	检索复选框是否选中 star
//
//function ischose() {
//	var input_arr = $("input[name='btSelectItem']");
//	console.log("跳转页码");
//	$.each(input_arr, function(i, item) {
//		var _cid = $(this).parent().next().html();
//		console.log(_cid);
//		if($.inArray(_cid, cid_arr) != -1 && cid_arr.length != 0) {
//			$(this).trigger("click");
//		}
//	})
//}
////	检索复选框是否选中 end
//</script>
////点击选中 end ===================================


//点击选中 star ===================================
<script type = "text/javascript" >
	//	选中复选框存入数组 star
	var cid_arr = new Array();
	var page = 0;
	$(document).ready(function() {
		$("input[name='btSelectItem']").off("click").on("click", function() {
			var _cid = $(this).parent().next().html();
			var _money = $(this).parent().siblings().children()[0].value;
			console.log(_money);
			var obj = {cid: _cid, money: _money};
			if(this.checked) {
				cid_arr.push(obj);
			} else {
				cid_arr.splice($.inArray(obj, cid_arr), 1);
			}
			console.log(cid_arr);
		})
		$("input[name='btSelectAll']").off("click").on("click", function() {
			var that = this;
			$.each($("input[name='btSelectItem']"), function(i, item) {
				var _cid = $(this).parent().next().html();
				var _money = $(this).parent().siblings().children()[0].value;
				console.log(_money);
				var obj = {cid: _cid, money: _money};
				if (that.checked) {
					if($.inArray(obj, cid_arr) == -1 && cid_arr.length != 0) {
						cid_arr.push(obj);
					}
				} else {
					cid_arr.splice($.inArray(obj, cid_arr), 1);
				}
			})
			console.log(cid_arr);
		})
		$("input[name='btSelectAll']").click( function() {
			alert(10);
		})
		
//		金额输入框事件
		$("input[type='number']").blur(function(){
			var _money = $(this).val();
			if (_money != '') {
				_cid = this.name;
				for (var i=0; i<cid_arr.length; i++) {
					if (_cid == cid_arr[i].cid) {
						cid_arr[i].money = _money;
						break;
					}
				}
				alert(_money);
			}
		})
		
		$(".page-number").bind("click", function() {
			console.log($(this).parent().children()[4].trigger("click"));
			
			var _page = $(this).children().html();
			alert(_page);
			for (var i=0; i<cid_arr.length; i++) {
					if (cid_arr[i].money == "") {
						alert("充值金额不能为空！");
						break;
					}
				}
		})
	});
//  选中复选框存入数组 end
//	检索复选框是否选中 star

function ischose() {
	var input_arr = $("input[name='btSelectItem']");
	console.log("跳转页码");
	$.each(input_arr, function(i, item) {
		var _cid = $(this).parent().next().html();
		console.log(_cid);
		if($.inArray(_cid, cid_arr) != -1 && cid_arr.length != 0) {
			$(this).trigger("click");
		}
	})
}
//	检索复选框是否选中 end
</script>
//点击选中 end ===================================