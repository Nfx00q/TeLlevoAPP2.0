import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss'],
})
export class UserInfoPage implements OnInit {

  usuario: any;

  constructor(
    private route: ActivatedRoute,
    private menuController: MenuController
  ) { }

  ngOnInit() {
    this.menuController.enable(false);
    this.route.queryParams.subscribe(params => {
      if (params && params['usuario']) {
        this.usuario = JSON.parse(params['usuario']);
      }
    });
  }
}
