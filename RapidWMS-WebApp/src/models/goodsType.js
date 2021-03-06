import { addGoodsType, deleteGoodsType, queryAllGoodsType, queryGoodsType, updateGoodsType } from '@/services/goodsType';

export default {
  namespace: 'goodsType',

  state: {
    list: [],
  },

  effects: {
    * fetch(state, { call, put }) {
      const response = yield call(queryGoodsType, state);
      yield put({
        type: 'save',
        payload: response,
      });
    },
    * submit({ payload, callback }, { call }) {
      let methodsName;
      if (payload.id) {
        methodsName = Object.keys(payload).length === 1 ? deleteGoodsType : updateGoodsType;
      } else {
        methodsName = addGoodsType;
      }
      const response = yield call(methodsName, payload);
      if (callback) callback(response);
    },
    * fetchAll(_, { call, put }) {
      const response = yield call(queryAllGoodsType);
      yield put({
        type: 'saveAllList',
        payload: response,
      });
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        list: action.payload ? action.payload : [],
      };
    },
    saveAllList(state, action) {
      return {
        ...state,
        allList: action.payload ? action.payload : [],
      };
    },
  },
};
