import { Suspense, lazy, useReducer } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Layout from 'components/parts/Layout';
import reducer, { ActionType, State } from 'reducers';
import Api from 'data/api';
import Cat from 'types';

import CatImage from 'components/views/CatImage';

const CatList = lazy(() => import('components/views/CatList'));
const BreedList = lazy(() => import('components/views/BreedList'));
const FavouriteList = lazy(() => import('components/views/FavouriteList'));

const initialState: State = { selected: null, favourites: [] };

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // The selected image can be a favourite
  const favourite = state.favourites.find(
    (item) => item.image.id === state.selected?.id
  );

  const handleSelectImage = (item: Cat.Image) => {
    dispatch({
      type: ActionType.Select,
      payload: item
    });
  };

  const handleCloseModal = () => {
    if (state.selected)
      dispatch({
        type: ActionType.Select,
        // Setting an empty string to id will close modal
        /// without breaking its animation
        payload: { ...state.selected, id: '' }
      });
  };

  const handleToggleFavourite = async () => {
    if (state.selected) {
      let payload: Cat.FavouriteImage = {
        image: {
          id: state.selected.id,
          url: ''
        },
        id: ''
      };

      try {
        if (!favourite) {
          const result = await Api.favourites.add(state.selected.id);
          payload.id = result.id;
        } else {
          await Api.favourites.remove(favourite.id);
          payload = favourite;
        }
      } catch (trouble) {
        console.error(trouble);
      }

      dispatch({
        type: ActionType.ToggleFavourite,
        payload
      });
    }
  };

  const handleShowImage = (selectedImage: Cat.Image) => {
    dispatch({
      type: ActionType.Select,
      payload: selectedImage
    });
  };

  const catImageProps = {
    selectedImage: state.selected,
    isFavourite: !!favourite,
    onClose: handleCloseModal,
    onToggleFavourite: handleToggleFavourite
  };

  return (
    <Router>
      <Layout>
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={
                <CatList onSelectItem={handleSelectImage}>
                  <CatImage {...catImageProps} />
                </CatList>
              }
            />
            <Route
              path="/images/:id"
              element={
                <CatList onSelectItem={handleSelectImage}>
                  <CatImage {...catImageProps} onShow={handleShowImage} />
                </CatList>
              }
            />
            <Route
              path="breeds"
              element={
                <BreedList
                  selectedImage={state.selected}
                  onSelectImage={handleSelectImage}
                >
                  <CatImage {...catImageProps} />
                </BreedList>
              }
            />
            <Route path="favourites" element={<FavouriteList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
