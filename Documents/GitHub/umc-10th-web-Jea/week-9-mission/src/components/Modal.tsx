import useCartStore from '../store/useCartStore';

const Modal = () => {
    const { isModalOpen, closeModal, clearCart } = useCartStore();

    if (!isModalOpen) return null;

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='bg-white p-8 rounded-md flex flex-col items-center gap-4'>
                <p className='text-lg font-semibold'>정말 삭제하시겠습니까?</p>
                <div className='flex gap-4'>
                    <button
                        className='px-6 py-2 border rounded-md cursor-pointer'
                        onClick={closeModal}
                    >
                        아니요
                    </button>
                    <button
                        className='px-6 py-2 bg-red-500 text-white rounded-md cursor-pointer'
                        onClick={() => {
                            clearCart();
                            closeModal();
                        }}
                    >
                        네
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;