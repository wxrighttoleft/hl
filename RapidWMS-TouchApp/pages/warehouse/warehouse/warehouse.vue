<template>
	<view>
		<view class="segment_area">
			<uni-segmented-control class='segment' :current="current" :values="items" @clickItem="onClickItem" style-type="button" active-color="#409eff"></uni-segmented-control>
		</view>
		<view class="content">
			<view v-show="current === 0">
				<view class="cu-bar search bg-white segment_area">
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue" @confirm="searchStocks" :adjust-position="false" type="text" placeholder="商品名、条码、库位" confirm-type="search"></input>
					</view>
					<view class="action">
						<uni-icons type="scan" size="30" @click="scanStock"></uni-icons>
						<!-- <button class="cu-btn bg-red round" @click="scanStock">扫码</button> -->
					</view>
				</view>
				<uni-list>
					<uni-list-item v-for="stock in stocks" :key="stock.id"
						:show-badge="true" 
						:badge-text="formatStockQuantity(stock.quantity)" 
						:badge-type="stock.isActive ? 'primary' : 'default'"
						clickable
						:note="formatNote(stock.goods.sn, stock.warePosition.name, stock.goods.customer.shortNameCn)"
						@click="viewStockDetail(stock.id)">
						<view slot="body" style="flex: 1;">
							<view class="flex-item">{{formatStockTitle(stock)}}</view>
							<view class="flex-item note">客户:{{stock.goods.customer.shortNameCn}}</view>
							<view class="flex-item note">库位:{{stock.warePosition.name}}</view>
							<view class="flex-item note">条码:{{stock.goods.sn}}</view>
						</view>
					</uni-list-item>
				</uni-list>
				<view class="uni-loadmore" v-if="showLoadMore">{{loadMoreText}}</view>
			</view>
			<view v-show="current === 1">
				<view class="cu-bar search bg-white segment_area">
					<view class="action">
						<uni-icons type="plus-filled" color="#007aff" size="30" @click="addReceiveGoods"></uni-icons>
						<!-- <button class="cu-btn round bg-blue" @click="addReceiveGoods">新增</button> -->
					</view>
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue2" @confirm="searchReceiveGoods" :adjust-position="false" type="text" placeholder="流水号、客户、操作人" confirm-type="search"></input>
					</view>
					<view class="action">						
						<uni-icons type="search" color="#007aff" size="30" @click="searchReceiveGoods"></uni-icons>
						<!-- <button class="cu-btn bg-green round" @click="searchReceiveGoods">搜索</button> -->
					</view>
				</view>
				<uni-segmented-control 
				class='segment' 
				:current="currentReceiveGoodsStatus" 
				:values="receiveGoodsStatusItems" 
				@clickItem="onClickReceiveGoodsStatusItem" 
				style-type="text" 
				active-color="#1296db">
				</uni-segmented-control>
				<uni-list>
					<uni-list-item v-for="item in receiveGoods" 
						:key="item.id" 
						:show-extra-icon="true" 
						clickable
						:extra-icon="formatIcon2(item.isAudited,item.isUnload)"
						:show-badge="true" 
						:badge-text="formatType2(item.receiveGoodsType)" 
						:badge-type="getBadgeType2(item.receiveGoodsType)"
						:title="formatTitle2(item.customer.shortNameCn, item.description)" 
						:note="formatNote2(item.createTime)"
						@click="viewReceiveGoodsDetail(item.id)" />
				</uni-list>
				<view class="uni-loadmore" v-if="showLoadMore2">{{loadMoreText2}}</view>
			</view>
			<view v-show="current === 2">
				<view class="cu-bar search bg-white segment_area">
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue3_1" @confirm="searchStockFlows" :adjust-position="false" type="text" placeholder="商品名、条码" confirm-type="search"></input>
					</view>
					<view class="action">
						<uni-icons type="scan" size="30" @click="scanGoods"></uni-icons>
						<!-- <button class="cu-btn bg-red round" @click="scanGoods">商品扫码</button> -->
					</view>
				</view>
				<view class="cu-bar search bg-white second_search_area">
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue3_2" @confirm="searchStockFlows" :adjust-position="false" type="text" placeholder="入库库位" confirm-type="search"></input>
					</view>
					<view class="action">
						<uni-icons type="scan" size="30" @click="scanWarePositionIn"></uni-icons>
						<!-- <button class="cu-btn bg-orange round" @click="scanWarePositionIn">入库位扫码</button> -->
					</view>
				</view>
				<view class="cu-bar search bg-white second_search_area">
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue3_3" @confirm="searchStockFlows" :adjust-position="false" type="text" placeholder="出库库位" confirm-type="search"></input>
					</view>
					<view class="action">
						<uni-icons type="scan" size="30" @click="scanWarePositionOut"></uni-icons>
						<!-- <button class="cu-btn bg-mauve round" @click="scanWarePositionOut">出库位扫码</button> -->
					</view>
				</view>
				<uni-list>
					<uni-list-item v-for="flow in stockFlows" :key="flow.id"
						:show-badge="true" 
						:badge-text="formatStockQuantity(flow.quantity)" 
						:badge-type="getBadgeType3(flow.flowOperateType)"
						:title="formatTitle3(flow)" 
						clickable
						:note="formatNote3(flow.goods.sn, flow.warePositionIn, flow.warePositionOut)"
						@click="viewStockFlowDetail(flow.id)">
						<view slot="body" style="flex: 1;">
							<view class="flex-item">{{formatTitle3(flow)}}</view>
							<view class="flex-item note">条码:{{flow.goods.sn}}</view>
							<view class="flex-item note">{{(flow.warePositionOut ? flow.warePositionOut.name : '空') + ' -> ' + (flow.warePositionIn ? flow.warePositionIn.name : '空')}}</view>
						</view>
					</uni-list-item>
				</uni-list>
				<view class="uni-loadmore" v-if="showLoadMore3">{{loadMoreText3}}</view>
			</view>
			<view v-show="current === 3">
				<view class="cu-bar search bg-white segment_area">
					<view class="search-form round">
						<text class="cuIcon-search"></text>
						<input v-model="searchValue4" @confirm="searchSpareWarePosition" :adjust-position="false" type="text" placeholder="库位" confirm-type="search"></input>
					</view>
					<view class="action">
						<uni-icons type="scan" size="30" @click="scanSpareWarePosition"></uni-icons>
					</view>
				</view>
				<uni-list>
					<uni-list-item 
						v-for="warePosition in spareWarePosition" 
						:key="warePosition.id"
						:title="warePosition.name"
						:note="warePosition.description===null?'未添加描述':warePosition.description"/>
				</uni-list>
				<view class="uni-loadmore" v-if="showLoadMore4">{{loadMoreText4}}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {uniSegmentedControl, uniList, uniListItem} from '@dcloudio/uni-ui'
	
	export default {
		components: {uniSegmentedControl, uniList, uniListItem},
		data() {
			return {
				current: 0,
				items: ['实时库存', '入库管理', '流水明细', '空余库位'],
				// 库存
				totalCount: 0,
				currentPage: 0,
				pageCount: 10,
				showLoadMore: false,
				loadMoreText: '',
				loading: false,
				searchValue: '',
				stocks: [],
				// 入库
				totalCount2: 0,
				currentPage2: 0,
				pageCount2: 10,
				showLoadMore2: false,
				loadMoreText2: '',
				loading2: false,
				searchValue2: '',
				receiveGoods: [],
				receiveGoodsStatusItems: ['待入库','未审核', '已审核', '全部'],
				currentReceiveGoodsStatus: 0,
				// 流水
				totalCount3: 0,
				currentPage3: 0,
				pageCount3: 10,
				showLoadMore3: false,
				loadMoreText3: '',
				loading3: false,
				searchValue3_1: '',
				searchValue3_2: '',
				searchValue3_3: '',
				stockFlows: [],
				// 空库位
				loading4: false,
				searchValue4:'',
				spareWarePosition:[],
				totalCount4: 0,
				currentPage4: 0,
				pageCount4: 10,
				showLoadMore4:false,
				loadMoreText4:''
			}
		},
		computed: {
			formatStockTitle() {
				return (stock) => {
					return `${stock.isActive ? '' : '冻结 | '}${stock.goods.name}`;
				}
			},
			formatStockQuantity() {
				return (quantity) => {
					return this.accounting.formatNumber(quantity);
				}
			},
			formatNote() {
				return (sn, warePositionName, customerName) => {
					return sn + ' | ' + warePositionName + ' | ' + customerName;
				}
			},
			formatIcon2() {
				return (isAudited,isUnload) => {
					if(!isUnload){
						return {
							color: 'green',
							size: '22',
							type: 'circle'
						};  
					}else if(!isAudited){
						return {
							color: 'green',
							size: '22',
							type: 'circle-filled'
						};
					}else{
						return {
							color: 'green',
							size: '22',
							type: 'checkbox-filled'
						};
					}
				}
			},
			formatType2() {
				return (type) => {
					switch (type) {
						case 'NEW':
							return "新增";
							break;
						case 'REJECTED':
							return "退货";
							break;
						default:
							return "未知";
							break;
					}
				}
			},
			getBadgeType2() {
				return (type) => {
					switch (type) {
						case 'NEW':
							return "primary";
							break;
						case 'REJECTED':
							return "warning";
							break;
						default:
							return "default";
							break;
					}
				}
			},
			formatTitle2() {
				return (shortNameCn, description) => {
					return shortNameCn + " | " + (description == null ? "无说明" : description);
				}
			},
			formatNote2() {
				return (createTime) => {
					return this.moment(createTime).format('YYYY-MM-DD HH:mm');
				}
			},
			formatTitle3() {
				return (flow) => {
					let type = "";
					switch(flow.flowOperateType) {
						case 'IN_ADD':
							type = '新入';
							break;
						case 'IN_CUSTOMER_REJECTED':
							type = '退入';
							break;
						case 'IN_PROFIT':
							type = '盘盈';
							break;
						case 'OUT_LOSSES':
							type = '盘亏';
							break;
						case 'OUT_ORDER_FIT':
							type = '出货';
							break;
						case 'MOVE':
							type = '移库';
							break;
						default:
							type = '未知';
							break;
					}
					return type + ' | ' + flow.goods.name;
				}
			},
			formatNote3() {
				return (sn, warePositionIn, warePositionOut) => {
					return sn + ' | ' + (warePositionOut ? warePositionOut.name : '空') + ' -> ' + (warePositionIn ? warePositionIn.name : '空');
				}
			},
			getBadgeType3() {
				return (type) => {
					switch(type) {
						case 'IN_ADD':
							return 'error';
							break;
						case 'IN_CUSTOMER_REJECTED':
							return 'warning';
							break;
						case 'IN_PROFIT':
							return 'success';
							break;
						case 'OUT_LOSSES':
							return 'warning';
							break;
						case 'OUT_ORDER_FIT':
							return 'primary';
							break;
						case 'MOVE':
							return 'primary';
							break;
						default:
							return 'default';
							break;
					}
				}
			},
		},
		methods: {
			onClickItem(index) {
				index = index.currentIndex
				if (this.current !== index) {
					this.current = index;
				}
				if (index == 1 && this.receiveGoods.length == 0) {
					this.loadReceiveGoods();
				}
				if (index == 2 && this.stockFlows.length == 0) {
					this.loadStockFlows();
				}
				if (index == 3 && this.spareWarePosition.length == 0) {
					this.loadSpareWarePosition();
				}
			},
			loadSpareWarePosition() {
				const url = `/api/ware_positions/spare?size=${this.pageCount4}&page=${this.currentPage4}${(this.searchValue4 ? "&search=" + this.searchValue4 : "")}`
				console.log(url)
				this.api.get(url).then(res => {
					if (res.statusCode == 200) {
						this.spareWarePosition = this.spareWarePosition.concat(res.data.content);
						this.totalCount4 = res.data.totalElements;
						if (this.totalCount4 < this.pageCount) {
							this.showLoadMore4 = true;
							this.loadMoreText4 = '没有更多数据了！';
						}
						if (this.totalCount4 == 0) {
							this.showLoadMore4 = true;
							this.loadMoreText4 = '没有找到符合条件的数据！';
						}
					}
				}).finally(() => {
					uni.stopPullDownRefresh();
				});
			},
			searchSpareWarePosition() {
				this.spareWarePosition = [];
				this.currentPage4 = 0;
				this.loadSpareWarePosition();
			},
			scanSpareWarePosition() {
				uni.scanCode({
					success: (res) => {
						this.searchValue4 = res.result;
						this.searchSpareWarePosition();
					}
				});
			},
			loadStocks() {
				this.loading = true;
				this.api.get("/api/stocks?size=" + this.pageCount + "&page=" + this.currentPage + (this.searchValue ? "&search=" + this.searchValue : "")).then(res => {
					if (res.statusCode == 200) {
						this.stocks = this.stocks.concat(res.data.content);
						this.totalCount = res.data.totalElements;
						if (this.totalCount < this.pageCount) {
							this.showLoadMore = true;
							this.loadMoreText = '没有更多数据了！';
						}
						if (this.totalCount == 0) {
							this.showLoadMore = true;
							this.loadMoreText = '没有找到符合条件的数据！';
						}
					}
				}).finally(() => {
					this.loading = false;
					uni.stopPullDownRefresh();
				});
			},
			searchStocks() {
				this.stocks = [];
				this.currentPage = 0;
				this.loadStocks();
			},
			
			scanStock() {
				uni.scanCode({
					success: (res) => {
						this.searchValue = res.result;
						this.searchStocks();
					}
				});
			},
			viewStockDetail(id) {
				uni.navigateTo({
					url: `../stock-detail/stock-detail?id=${id}`,
					animationType: 'slide-in-right'
				});
			},
			loadReceiveGoods() {
				this.loading2 = true;
				this.api.get("/api/receive_goods?size=" + this.pageCount2 + "&page=" + this.currentPage2 + (this.searchValue2 ? "&search=" + this.searchValue2 : "") + this.getFilterQueryString()).then(res => {
					if (res.statusCode == 200) {
						this.receiveGoods = this.receiveGoods.concat(res.data.content);
						this.totalCount2 = res.data.totalElements;
						if (this.totalCount2 < this.pageCount2) {
							this.showLoadMore2 = true;
							this.loadMoreText2 = '没有更多数据了！';
						}
						if (this.totalCount2 == 0) {
							this.showLoadMore2 = true;
							this.loadMoreText2 = '没有找到符合条件的数据！';
						}
					}
				}).finally(() => {
					this.loading2 = false;
					uni.stopPullDownRefresh();
				});
			},
			searchReceiveGoods() {
				this.receiveGoods = [];
				this.currentPage2 = 0;
				this.loadReceiveGoods();
			},
			onClickReceiveGoodsStatusItem(index) {
				index = index.currentIndex
				if (this.currentReceiveGoodsStatus !== index) {
					this.currentReceiveGoodsStatus = index;
				}
				this.receiveGoods = [];
				this.currentPage2 = 0;
				this.loadReceiveGoods();
			},
			getFilterQueryString() {
				switch (this.currentReceiveGoodsStatus) {
					case 0:
						return '&isUnloadFilter=false';
					case 1:
						return '&isUnloadFilter=true&isAuditedFilter=false';
					case 2:
						return '&isUnloadFilter=true&isAuditedFilter=true'
					case 3:
						return ''
					default:
						return '';
				}
			},
			viewReceiveGoodsDetail(id) {
				uni.navigateTo({
					url: `../receive-goods-detail/receive-goods-detail?id=${id}`,
					animationType: 'slide-in-right'
				});
			},
			addReceiveGoods() {
				uni.navigateTo({
					url: '../receive-goods-add/receive-goods-add',
					animationType: 'slide-in-bottom'
				});
			},
			loadStockFlows() {
				this.loading3 = true;
				this.api.get("/api/stock_flows?size=" + this.pageCount3 + "&page=" + this.currentPage3 + 
					(this.searchValue3_1 ? "&search=" + this.searchValue3_1 : "") + 
					(this.searchValue3_2 ? "&searchWarePositionIn=" + this.searchValue3_2 : "") +
					(this.searchValue3_3 ? "&searchWarePositionOut=" + this.searchValue3_3 : "")).then(res => {
					if (res.statusCode == 200) {
						this.stockFlows = this.stockFlows.concat(res.data.content);
						this.totalCount3 = res.data.totalElements;
						if (this.totalCount3 < this.pageCount3) {
							this.showLoadMore3 = true;
							this.loadMoreText3 = '没有更多数据了！';
						}
						if (this.totalCount3 == 0) {
							this.showLoadMore3 = true;
							this.loadMoreText3 = '没有找到符合条件的数据！';
						}
					}
				}).finally(() => {
					this.loading3 = false;
					uni.stopPullDownRefresh();
				});
			},
			searchStockFlows() {
				this.stockFlows = [];
				this.currentPage3 = 0;
				this.loadStockFlows();
			},
			scanGoods() {
				uni.scanCode({
					success: (res) => {
						this.searchValue3_1 = res.result;
						this.searchStockFlows();
					}
				});
			},
			scanWarePositionIn() {
				uni.scanCode({
					success: (res) => {
						this.searchValue3_2 = res.result;
						this.searchStockFlows();
					}
				});
			},
			scanWarePositionOut() {
				uni.scanCode({
					success: (res) => {
						this.searchValue3_3 = res.result;
						this.searchStockFlows();
					}
				});
			},
			viewStockFlowDetail(id) {
				uni.navigateTo({
					url: `../stock-flow-detail/stock-flow-detail?id=${id}`,
					animationType: 'slide-in-right'
				});
			}
		},
		onLoad() {
			this.loadStocks();
			
			uni.$on('updateReceiveGoodsList', (updateItem)=>{
				let index = null;
				let newItem = null;
				const updateReceiveGoodsItem = (item) => {
					for (var i = 0; i < this.receiveGoods.length; i++) {
						if (this.receiveGoods[i].id == item.id) {
							index = i;
							newItem = item;
							break;
						}
					}
					if (index != null && newItem != null) {
						this.receiveGoods.splice(index, 1, newItem);
					}
				};
				if (updateItem.method == 'add') {
					if (this.currentReceiveGoodsStatus != 1) {
						this.receiveGoods.unshift(updateItem.item);
					}
				}
				if (updateItem.method == 'delete') {
					this.receiveGoods = this.receiveGoods.filter(item => item.id != updateItem.item.id);
				}
				if (updateItem.method == 'audit' || updateItem.method == 'cancel_audit') {
					if (this.currentReceiveGoodsStatus != 2) {
						this.receiveGoods = this.receiveGoods.filter(item => item.id != updateItem.item.id);
					} else {
						updateReceiveGoodsItem(updateItem.item);
					}
				}
				if (updateItem.method == 'update') {
					updateReceiveGoodsItem(updateItem.item);
				}
			});
			
			uni.$on('operateStockSuccess',() => {
				this.stocks = [];
				this.currentPage = 0;
				this.loadStocks();
			});
		},
		onUnload() {
			uni.$off('updateReceiveGoodsList');
			uni.$off('operateStockSuccess');
		},
		onPullDownRefresh() {
			switch(this.current) {
				case 0:
					this.stocks = [];
					this.currentPage = 0;
					this.searchValue = '';
					this.loadStocks();
					break;
				case 1:
					this.receiveGoods = [];
					this.currentPage2 = 0;
					this.searchValue2 = '';
					this.loadReceiveGoods();
					break;
				case 2:
					this.stockFlows = [];
					this.currentPage3 = 0;
					this.searchValue3_1 = '';
					this.searchValue3_2 = '';
					this.searchValue3_3 = '';
					this.loadStockFlows();
					break;	
			}
		},
		onReachBottom() {
			switch(this.current) {
				case 0:
					if (this.totalCount <= this.pageCount || this.pageCount * (this.currentPage + 1) >= this.totalCount) {
						this.loadMoreText = "没有更多数据了!"
						return;
					}
					this.showLoadMore = true;
					this.loadMoreText = "加载中...";
					this.currentPage += 1;
					this.loadStocks();
					break;
				case 1:
					if (this.totalCount2 <= this.pageCount2 || this.pageCount2 * (this.currentPage2 + 1) >= this.totalCount2) {
						this.loadMoreText2 = "没有更多数据了!"
						return;
					}
					this.showLoadMore2 = true;
					this.loadMoreText2 = "加载中...";
					this.currentPage2 += 1;
					this.loadReceiveGoods();
					break;
				case 2:
					if (this.totalCount3 <= this.pageCount3 || this.pageCount3 * (this.currentPage3 + 1) >= this.totalCount3) {
						this.loadMoreText3 = "没有更多数据了!"
						return;
					}
					this.showLoadMore3 = true;
					this.loadMoreText3 = "加载中...";
					this.currentPage3 += 1;
					this.loadStockFlows();
					break;	
			}
		},
	}
</script>

<style>
	.segment_area {
		margin-top: 25upx;
	}
	.second_search_area {
		margin-top: 2upx;
	}
	.uni-loadmore{
		height:80upx;
		line-height:80upx;
		text-align:center;
		padding-bottom:30upx;
	}
	.note{
		font-size: 12px;
		color: #999;
	}
</style>
