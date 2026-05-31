import './App.css'
import Navbar from './components/Navbar'
import CartList from './components/CartList'
import PriceBox from './components/PriceBox'
import Modal from './components/Modal'

function App() {
    return (
        <>
            <Navbar />
            <CartList />
            <PriceBox />
            <Modal />
        </>
    );
}

export default App;