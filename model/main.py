
import numpy as np
import pandas as pd
import os
for dirname, _, filenames in os.walk('/kaggle/input/fire-smoke-and-neutral/FIRE-SMOKE-DATASET/Test'):
    
    for drn,_,fln in os.walk(dirname):
        print(fln)

from tensorflow.keras.applications import VGG16
from tensorflow.keras.models import Model
import numpy as np


base_model = VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
feature_extractor = Model(inputs=base_model.input, outputs=base_model.output)

from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.vgg16 import preprocess_input

def preprocess_and_extract(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    
    
    features = feature_extractor.predict(img_array)
    features = features.flatten()
    return features


import os
img_paths = []
labels = []
paths = ['Fire','Smoke','Neutral']

for path in paths:
    PATH = "/kaggle/input/fire-smoke-and-neutral/FIRE-SMOKE-DATASET/Train/"
    PATH = PATH+path
    for dirname, _, filenames in os.walk(f'{PATH}'):
        print(dirname)
        print(len(filenames))
        for filename in filenames:
            img_path = os.path.join(dirname,filename)
            img_paths.append(img_path)
            if path=='Fire':
                labels.append(1)
            elif path=="Smoke":
                labels.append(2)
            else:
                labels.append(0)
            
print(len(img_paths))
print(len(labels))


feature_vectors = [preprocess_and_extract(img_path) for img_path in img_paths]
feature_vectors = np.array(feature_vectors)
labels = np.array(labels)

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(feature_vectors, labels, test_size=0.2, random_state=42)

log_reg = LogisticRegression()
log_reg.fit(X_train, y_train)

y_pred = log_reg.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.2f}")

def predict_fire_smoke(img_path):
    features = preprocess_and_extract(img_path)
    prediction = log_reg.predict([features])
    
    if prediction == 1:
        return "Fire"
    elif prediction == 2:
        return "Smoke"
    elif prediction == 0:
        return "Neutral"


print(predict_fire_smoke("/kaggle/input/fire-smoke-and-neutral/FIRE-SMOKE-DATASET/Test/Fire/image_0.jpg"))
print(predict_fire_smoke("/kaggle/input/fire-smoke-and-neutral/FIRE-SMOKE-DATASET/Test/Neutral/image_0.jpg"))
print(predict_fire_smoke("/kaggle/input/fire-smoke-and-neutral/FIRE-SMOKE-DATASET/Test/Smoke/image_0.jpg"))

import joblib
joblib.dump(log_reg, "/kaggle/working/fire_smoke_model.pkl")
