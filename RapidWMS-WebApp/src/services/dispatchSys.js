import request from '@/utils/request';

export async function queryAddressType(params) {
  const {
    payload: { search, pageSize, currentPage, orderBy },
  } = params;

  let queryString = '/api/dispatch_sys?';
  if (search && search !== '') queryString += `search=${search}&`;
  if (pageSize && pageSize !== '') queryString += `size=${pageSize}&`;
  if (currentPage && currentPage !== '') queryString += `page=${currentPage - 1}&`;
  if (orderBy && orderBy !== '') queryString += `sort=${orderBy.substring(0, orderBy.length - 3)}`;
  if (queryString.charAt(queryString.length - 1) === '&')
    queryString = queryString.substring(0, queryString.length - 1);
  return request(queryString);
}

export async function queryAllAddressType() {
  return request('/api/dispatch_sys/all_list');
}

export async function addAddressType(payload) {
  return request('/api/dispatch_sys', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAddressType(payload) {
  return request('/api/dispatch_sys', {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteAddressType(params) {
  return request(`/api/dispatch_sys/${params.id}`, {
    method: 'DELETE',
  });
}
