import {createSlice} from "@reduxjs/toolkit"
import batched from "../enhancers/batched";
import unbatched from "../enhancers/unbatched";
import signer from "../enhancers/signer";
import proxy from "../enhancers/proxy";
import {commitHistory, precommitHistory, redoHistory, undoHistory, restartHistory, configureBatchHistory, configureHistory} from "../reducers";
import {isFunction} from "../utils/function";

const commitReducers = {
    commitHistory: commitHistory,
    precommitHistory: precommitHistory,
}

const historyReducers = {
    redoHistory: redoHistory,
    undoHistory: undoHistory,
    restartHistory: restartHistory,
    configureHistory:  configureHistory,
    configureBatchHistory: configureBatchHistory, 
}

const createVersionedSlice = ({
    name,
    initialState,
    reducers,
    extraReducers,
}) => {

    const history = {
        version: 0,
        present: initialState,
        timeline: [],
    };
    const timer = {
        batchTime: 3000,
        batchTimeLimit: 9000,
    }
    const batch = {
        patches: [],
        configuration: timer,
        past: null,
    }
    const configuration = {
        historyLimit: 9999999,
    }
    const versionedState = {
        history: history,
        batch: batch,
        configuration: configuration,
    };

    const completeReducers = Object.entries(reducers)
    .reduce((completeReducers, [reducer_name, reducer]) => {
        function withEnhancers(reducer, ...enhancers) {
            const reducerFn = isFunction(reducer) ? reducer: reducer.reducer;
            const reducerEnhanced = enhancers.reduce((reducer, enhancer) => (
                enhancer(reducer)
            ), reducerFn);
            return (
                isFunction(reducer) 
                ? reducerEnhanced 
                : {...reducer, reducer: reducerEnhanced}
            );
        }
        const batched_name = `${reducer_name}/batched`;
        const unbatched_name = `${reducer_name}/unbatched`;
        const unrecorder_name = `${reducer_name}/unrecorded`;
        completeReducers[batched_name] = withEnhancers(reducer, batched);
        completeReducers[unbatched_name] = withEnhancers(reducer, unbatched);
        completeReducers[unrecorder_name] = withEnhancers(reducer, proxy, signer);
        // Raw reducer, as it would have 
        // been returned by normal
        // createSlice function. Behaviour
        // is implemeted because this function
        // is supposed to be a wrapper, so 
        // there are should be no changes to
        // root createSlice function in params
        // or return values.
        completeReducers[reducer_name] = reducer;
        return completeReducers;
    }, {});

    const signedHistoryReducers = Object.entries(historyReducers)
    .reduce((reducers, [type, reducer]) => {
        reducers[type] = signer(reducer);
        return reducers;
    }, {});

    const versionedReducers = {
        ...completeReducers,
        ...commitReducers,
        ...signedHistoryReducers,
    };

    const slice = createSlice({
        name: name,
        initialState: versionedState,
        reducers: versionedReducers,
        extraReducers: extraReducers,
    });

    const initialExtra = {
        batched: {},
        unbatched: {},
        unrecorded: {},
    };

    const extraActions = Object.entries(slice.actions)
    .reduce((extraActions, [actionType, action]) => {
        const typeSplit = actionType.split('/').reverse();
        const [batch, type] = typeSplit;
        if (extraActions[batch]) {
            extraActions[batch][type] = action;
        }
        return extraActions;
    }, initialExtra);
    slice.extraActions = extraActions;
    
    return slice;
}

export default createVersionedSlice;