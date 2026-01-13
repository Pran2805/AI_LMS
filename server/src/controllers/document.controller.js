import fs from 'fs'
export const uploadDocument = async(req, res) =>{
    try {
        
    } catch (error) {
        
        if(req.file){
            await fs.unlink(req.file.path)
            .catch(()=>{
                
            })
        }
    }
}