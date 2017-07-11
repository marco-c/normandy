import * as localForage from 'localforage';

import {
  ACTION_RECEIVE,
  RECIPE_DELETE,
  RECIPE_RECEIVE,
  RECIPE_FILTERS_RECEIVE,
  RECIPE_HISTORY_RECEIVE,
  RECIPES_LISTING_COLUMNS_CHANGE,
  RECIPES_PAGE_RECEIVE,
  REVISION_RECEIVE,
} from 'control_new/state/action-types';
import {
  makeApiRequest,
} from 'control_new/state/requests/actions';


function recipeReceived(recipe) {
  return dispatch => {
    dispatch({
      type: RECIPE_RECEIVE,
      recipe,
    });

    dispatch({
      type: ACTION_RECEIVE,
      action: recipe.action,
    });

    dispatch({
      type: REVISION_RECEIVE,
      revision: recipe.latest_revision,
    });

    if (recipe.approved_revision) {
      dispatch({
        type: REVISION_RECEIVE,
        revision: recipe.approved_revision,
      });
    }
  };
}


export function fetchRecipe(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`));
    dispatch(recipeReceived(recipe));
  };
}


export function fetchRecipesPage(pageNumber = 1) {
  return async dispatch => {
    const requestId = `fetch-recipes-page-${pageNumber}`;
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      data: { page: pageNumber },
    }));

    recipes.results.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });

    dispatch({
      type: RECIPES_PAGE_RECEIVE,
      pageNumber,
      recipes,
    });
  };
}


export function fetchFilteredRecipesPage(pageNumber = 1, filters = {}) {
  return async dispatch => {
    const filterIds = Object.keys(filters).map(key => `${key}-${filters[key]}`);
    const requestId = `fetch-filtered-recipes-page-${pageNumber}-${filterIds.join('-')}`;
    const recipes = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      data: {
        ...filters,
        page: pageNumber,
      },
    }));

    recipes.results.forEach(recipe => {
      dispatch(recipeReceived(recipe));
    });

    dispatch({
      type: RECIPES_PAGE_RECEIVE,
      pageNumber,
      recipes,
    });
  };
}


export function createRecipe(recipeData) {
  return async dispatch => {
    const requestId = 'create-recipe';
    const recipe = await dispatch(makeApiRequest(requestId, 'v2/recipe/', {
      method: 'POST',
      data: recipeData,
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function updateRecipe(pk, recipeData) {
  return async dispatch => {
    const requestId = `update-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`, {
      method: 'PATCH',
      data: recipeData,
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function deleteRecipe(pk) {
  return async dispatch => {
    const requestId = `delete-recipe-${pk}`;

    await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/`, {
      method: 'DELETE',
    }));

    dispatch({
      type: RECIPE_DELETE,
      recipeId: pk,
    });
  };
}


export function enableRecipe(pk) {
  return async dispatch => {
    const requestId = `enable-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/enable/`, {
      method: 'POST',
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function disableRecipe(pk) {
  return async dispatch => {
    const requestId = `enable-recipe-${pk}`;
    const recipe = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/disable/`, {
      method: 'POST',
    }));
    dispatch(recipeReceived(recipe));
  };
}


export function fetchRecipeHistory(pk) {
  return async dispatch => {
    const requestId = `fetch-recipe-history-${pk}`;
    const revisions = await dispatch(makeApiRequest(requestId, `v2/recipe/${pk}/history/`));

    dispatch({
      type: RECIPE_HISTORY_RECEIVE,
      recipeId: pk,
      revisions,
    });

    revisions.forEach(revision => {
      dispatch({
        type: REVISION_RECEIVE,
        revision,
      });
    });
  };
}


export function fetchRecipeFilters() {
  return async dispatch => {
    const requestId = 'fetch-recipe-filters';
    const filters = await dispatch(makeApiRequest(requestId, 'v2/filters/'));

    dispatch({
      type: RECIPE_FILTERS_RECEIVE,
      filters,
    });
  };
}


export function saveRecipeListingColumns(columns) {
  return async dispatch => {
    await localForage.setItem('recipe_listing_columns', columns);

    dispatch({
      type: RECIPES_LISTING_COLUMNS_CHANGE,
      columns,
    });
  };
}