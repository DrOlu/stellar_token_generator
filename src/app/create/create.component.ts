import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { TokenService } from '../shared/token.service';
import { SnackService } from '../shared/snack.service';

// var Stellar =StellarSdk;
@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  faSpinner=faSpinner;
  form: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    // private route: ActivatedRoute
    private TokenS: TokenService,
    private SnackS: SnackService
    ) { }

  ngOnInit(): void {
    // console.log(StellarSdk);
    this.form = this.formBuilder.group({
        networkType: ['', Validators.required],
        issuerSecret:['', Validators.required],
        distSecret:['', Validators.required],
        assetCode:['', Validators.required],
        amount: ['', Validators.required],
        requireAuth:[''],
        revokeAuth:[''],
        lockAccount:[''],
        distType: [''],
        distAmount:[''],
        distPrice:['']
    });
  }
  get f() { return this.form.controls; }

  onSubmit(){
    this.submitted = true;
    // stop here if form is invalid
    if (this.form.invalid) {
        return;
    }
    this.loading = true;
    // console.log(this.f, this.loading);
    var moba = {
      assetCode:this.f.assetCode.value,
      networkType: this.f.networkType.value,
      issuerSecret:this.f.issuerSecret.value,
      distSecret: this.f.distSecret.value,
      amount:this.f.amount.value,
      requireAuth:this.f.requireAuth.value,
      revokeAuth:this.f.revokeAuth.value,
      lockAccount:this.f.lockAccount.value,
      distType: this.f.distType.value,
      distAmount:this.f.distAmount.value,
      distPrice:this.f.distPrice.value,
      assetType: 1
    }

    this.TokenS.createAsset(moba).then((resp)=>{
      // console.log(resp);
      this.SnackS.success(resp.message, 'Okay');
      this.loading=false;
      this.submitted=false;
      this.form.reset();
    }).catch((err)=>{
      console.log(err);
      this.SnackS.error(err, 'Try again!!');
      this.loading=false;
      this.submitted=false;
      // this.form.reset();
    });
  }

  isDEX = function(type) {
    // console.log(type) 
    if (type) {
      return true;
    } else{
      return false;
    }
  };
}
