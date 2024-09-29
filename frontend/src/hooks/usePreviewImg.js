import { useState } from "react";
import useShowToast from "./useShowToast";

const usePreviewImg = () => {
    const [imgUrl, setImgUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); // Track selected file
    const showToast = useShowToast();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setImgUrl(reader.result);
            };

            reader.readAsDataURL(file);
            setSelectedFile(file); // Save selected file
        } else {
            showToast("Invalid file type", "Please select an image file", "error");
            setImgUrl(null);
            setSelectedFile(null); // Reset selected file
        }
    };

    return { handleImageChange, imgUrl, selectedFile, setImgUrl };
};

export default usePreviewImg;
