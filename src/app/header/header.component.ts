import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  openNav=false
  constructor() { }

  ngOnInit(): void {
  }

  showmenu(val){
    console.log(val)
    this.openNav=!this.openNav
  }
  
}
