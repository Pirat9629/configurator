import { normalize } from 'normalizr';
import * as schema from './schema';
import { getActiveLocaleID } from '../reducers/locales';
import { getIsFetching, getConfiguratorById } from '../reducers/configurators';
import { getFixedOrderProducts } from '../reducers/configurator';
import { getStepsIds } from '../reducers/steps';
import * as api from '../api';

export const fetchConfiguratorsIds = () => (dispatch, getState) => {
  if(getIsFetching(getState())) {
    return Promise.resolve();
  }

  dispatch({
    type: 'FETCH_CONFIGURATORS_REQUEST'
  });

  return api.fetchConfiguratorsIds().then(
    response => {
      dispatch({
        type: 'FETCH_CONFIGURATORS_SUCCESS',
        response: normalize(response, schema.arrayOfConfigurators)
      });
    },
    error => {
      dispatch({
        type: 'FETCH_CONFIGURATORS_FAILURE',
        message: error.message || 'Something went wrong.'
      });
    }
  );
};

export const selectConfigurator = (id) => (dispatch, getState) => {
  if(getIsFetching(getState())) {
    return Promise.resolve();
  }

  dispatch({
    type: 'SELECT_CONFIGURATOR_REQUEST'
  });

  return api.selectConfigurator(id, getActiveLocaleID(getState())).then(
    response => {
      dispatch({
        type: 'SELECT_CONFIGURATOR_SUCCESS',
        configurator: response
      });

      let orderProducts = getFixedOrderProducts(getState());
      let nextOrder = orderProducts.nextOrder;
      orderProducts = orderProducts.allProducts;
      orderProducts.forEach(product => {
        if (product.accessory) {
          dispatch({
            type: 'SET_ACCESSORY_PRODUCT_ORDER',
            productID: product.productID,
            order: product.order
          });
        } else {
          dispatch({
            type: 'SET_BASE_CONFIG_PRODUCT_ORDER',
            productID: product.productID,
            order: product.order,
            baseConfigID: product.baseConfigID
          });
        }
      });
      dispatch({
        type: 'SET_NEXT_ORDER',
        order: nextOrder
      });
      dispatch({
        type: 'NEXT_STEP',
        steps: getStepsIds(getState())
      });
    },
    error => {
      dispatch({
        type: 'SELECT_CONFIGURATOR_FAILURE',
        message: error.message || 'Something went wrong.'
      });
    }
  );
};

export const removeConfigurator = (id) => (dispatch, getState) => {
  if(getIsFetching(getState())) {
    return Promise.resolve();
  }

  dispatch({
    type: 'REMOVE_CONFIGURATOR_REQUEST'
  });

  return api.removeConfigurator(id).then(
    response => {
      dispatch({
        type: 'REMOVE_CONFIGURATOR_SUCCESS',
        response: normalize(response, schema.arrayOfConfigurators)
      });
    },
    error => {
      dispatch({
        type: 'REMOVE_CONFIGURATOR_FAILURE',
        message: error.message || 'Something went wrong.'
      });
    }
  );
};


export const createOrFindConfigurator = (id) => (dispatch, getState) => {
  if(getIsFetching(getState())) {
    return Promise.resolve();
  }

  if(getConfiguratorById(getState(), id)) {
    dispatch({
      type: 'SELECT_CONFIGURATOR_REQUEST'
    });

    return api.selectConfigurator(id, getActiveLocaleID(getState())).then(
      response => {
        dispatch({
          type: 'SELECT_CONFIGURATOR_SUCCESS',
          configurator: response
        });
        dispatch({
          type: 'NEXT_STEP',
          steps: getStepsIds(getState())
        });
      },
      error => {
        dispatch({
          type: 'SELECT_CONFIGURATOR_FAILURE',
          message: error.message || 'Something went wrong.'
        });
      }
    );
  } else {
    dispatch({
      type: 'CREATE_CONFIGURATOR',
      id: id
    });
  }

  dispatch({
    type: 'NEXT_STEP',
    steps: getStepsIds(getState())
  });
};

export const saveConfigurator = (configurator) => (dispatch, getState) => {
  return api.saveConfigurator(configurator, getActiveLocaleID(getState())).then(
    response => {
      if (response) {
        dispatch({
          type: 'REMOVE_CONFIGURATOR_REQUEST'
        });

        api.removeConfigurator(configurator.config.configuratorID + '-temp').then(
          response => {
            dispatch({
              type: 'REMOVE_CONFIGURATOR_SUCCESS',
              response: normalize(response, schema.arrayOfConfigurators)
            });
          },
          error => {
            dispatch({
              type: 'REMOVE_CONFIGURATOR_FAILURE',
              message: error.message || 'Something went wrong.'
            });
          }
        );
        return true;
      } else {
        return false;
      }
    }
  );
};

export const getPreviewUrl = (configurator) => (dispatch, getState) => {
  let oldID = configurator.config.configuratorID;
  configurator.config.configuratorID+= '-temp';
  return api.saveConfigurator(configurator, getActiveLocaleID(getState())).then(
    response => {
      configurator.config.configuratorID = oldID;
      if (response) {
        return api.getPreviewUrl(oldID,  getActiveLocaleID(getState())).then(
          response => {
            return response;
          }
        );
      } else {
        return false;
      }
    }
  );
};