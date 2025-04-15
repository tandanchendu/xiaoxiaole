import os
from PyTexturePacker import Packer 
dir=os.path.dirname(__file__)
images = f"{dir}/images"
packer = Packer.create(max_width=2048,max_height=2048)
packer.pack(images,"imgList",f"{dir}/output")

# def reName():
#     i=1
#     for root,dirs,files in os.walk(images):
#         for file in files:
#             cmd= f"rename \"{images}\{file}\" \"item{i}.png\""
#             print(f"{cmd}")

#             os.system(cmd)
#             i+=1