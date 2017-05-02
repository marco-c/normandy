import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';

import {
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
} from '../action-types';


function filters(state = new Map(), action) {
  switch (action.type) {
    case RECIPE_FILTERS_RECEIVE:
      return fromJS(action.filters);

    default:
      return state;
  }
}


function history(state = new Map(), action) {
  switch (action.type) {
    case RECIPE_HISTORY_RECEIVE:
      return state.set(action.recipeId, fromJS(action.revisions.map(revision => revision.id)));

    default:
      return state;
  }
}


function items(state = new Map(), action) {
  switch (action.type) {
    case RECIPE_RECEIVE:
      return state.set(action.recipe.id, fromJS(action.recipe));

    default:
      return state;
  }
}


export default combineReducers({
  filters,
  history,
  items,
});
