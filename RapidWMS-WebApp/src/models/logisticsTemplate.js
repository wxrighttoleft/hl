import {
  addLogisticsTemplate,
  deleteLogisticsTemplate,
  queryAllLogisticsTemplate,
  queryLogisticsTemplate,
  updateLogisticsTemplate,
  fetchGroupAll,
} from '@/services/logisticsTemplate';

export default {
  namespace: 'logisticsTemplate',

  state: {
    list: [],
  },

  effects: {
    *fetch(state, { call, put }) {
      const response = yield call(queryLogisticsTemplate, state);
      if (response !== undefined && response !== null) {
        yield put({
          type: 'save',
          payload: response,
        });
      }
    },
    *submit({ payload, callback }, { call }) {
      let methodsName;
      if (payload.id) {
        methodsName =
          Object.keys(payload).length === 1 ? deleteLogisticsTemplate : updateLogisticsTemplate;
      } else {
        methodsName = addLogisticsTemplate;
      }
      const response = yield call(methodsName, payload);
      if (callback) callback(response);
    },
    *fetchAll(_, { call, put }) {
      const response = yield call(queryAllLogisticsTemplate);
      yield put({
        type: 'saveAllList',
        payload: response,
      });
    },
    *fetchGroupAll(_, { call, put }) {
      const response = yield call(fetchGroupAll);
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
