import ChatApp from './components/ChatApp.tsx';
import './App.css';
import 'devextreme/dist/css/dx.fluent.blue.light.css';

function App(): JSX.Element {
  return (
    <div className="main">
      <ChatApp />
    </div>
  );
}

export default App;
