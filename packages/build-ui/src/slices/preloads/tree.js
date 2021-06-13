import {createVersionedState, loadVersionedSliceHistory} from "../../history/wrappers/createVersionedSlice";
import {branch, plainBranch} from "../../utils/tree";

// Initial preloaded state
// for tree slice is defined
// here as the return value of
// below function.

// Will call function in configureStore.
// Will not call in createSlice to pass 
// as initialState value.
// @see: https://redux.js.org/recipes/structuring-reducers/initializing-state

const preloadedTree = ({
    initialTree,
    initialHistoryLimit,
    initialBatchTime,
    initialBatchTimeLimit,
}) => {
    const initialState = (
        initialTree 
        // Convert passed 
        // initialTree to 
        // flat object, if any.
        ? plainBranch(initialTree)
        // Convert fallback 
        // initialTree to 
        // flat object.
        : plainBranch(branch())
    );
    return createVersionedState({
        initialState: initialState,
        initialHistoryLimit,
        initialBatchTime,
        initialBatchTimeLimit,
    })
}

const preloadedTreeHistory = ({
    initialTreeSlice,
    initialHistory,
}) => {
    return loadVersionedSliceHistory({
        initialSlice: initialTreeSlice,
        initialHistory: initialHistory
    });
}

export default preloadedTree;
export {preloadedTreeHistory};