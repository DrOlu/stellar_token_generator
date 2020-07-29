import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SnackService{
    success(message, confirmbutton, timeout?){
        if(timeout)return this.showAlertTimeout('success', message, 'success', confirmbutton, timeout)
        return this.showAlert('success', message, 'success', confirmbutton);
    }
    error(message, confirmbutton, timeout?){
        if(timeout)return this.showAlertTimeout('error', message, 'error', confirmbutton, timeout)
        return this.showAlert('error', message, 'error', confirmbutton);
    }
    warn(message, confirmbutton, timeout?){
        if(timeout)return this.showAlertTimeout('warning', message, 'warning', confirmbutton, timeout)
        return this.showAlert('warning', message, 'warning', confirmbutton);
    }

    showAlert(title, message, icon, confirmButtonText?){
        Swal.fire({
            title,
            text: message,
            icon,
            confirmButtonText,
            backdrop: `
            rgba(0,0,123,0.4)
            left top
            no-repeat`
        })
    }
    showAlertTimeout(title, message, icon, confirmButtonText?,timeout?){
        Swal.fire({
            title,
            text: message,
            icon,
            confirmButtonText,
            backdrop: `
            rgba(0,0,123,0.4)
            url("/images/nyan-cat.gif")
            left top
            no-repeat`,
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            },
            timer: timeout||3000,
            timerProgressBar: true,
            onBeforeOpen: () => {
              Swal.showLoading()
            },
            onOpen: ()=>{
                setTimeout(()=>{
                    Swal.clickConfirm();
                }, timeout || 3000)
            }
        })
    }
}