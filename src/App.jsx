
import './App.css';
import { useMemo } from 'react';
import { MainRoutes } from './Routes/MainRoutes';
import { Provider } from 'react-redux';
import store from './Redux/Slices/store.ts';

function App() {
  const mainRouteComponent = useMemo(() => <MainRoutes />, []);

  return (
       <div className="main-app">
        <Provider store={store}>
        {mainRouteComponent}
        </Provider>
    </div>
  );
}

export default App;
