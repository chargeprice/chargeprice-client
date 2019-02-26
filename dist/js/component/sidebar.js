class Sidebar {

  constructor() {
    this.component = $("#sidebar");
    $("#sidebar-close").click(() => this.close());

    $("#adapt-settings").click(() => {
      this.open("settings");
    });
    $("#show-info").click(() => {
      this.open("info");
    });

    this.sidebarContent = {
      "settings": {
        header: "Eingaben",
        contentId: "settingsContent"
      },
      "info": {
        header: "Info",
        contentId: "infoContent"
      },
      "prices": {
        header: "Preise",
        contentId: "pricesContent"
      }
    };

    this.currentSidebarContentKey = null;

    this.close();
    this.hideAllSidebarContent();
    this.registerConverters();
  }

  registerConverters() {
    $.views.converters({
      dec: function (val) {
        return val.toFixed(2);
      }
    });
  }

  showStation(station, options) {
    const sortedConnectors = station.connectors.sort((a, b) => b.speed - a.speed);
    const connectorsHtml = $.templates("#connectorTempl").render(sortedConnectors);
    $("#select-connector").html(connectorsHtml);
    this.open("prices");
  }

  updateStationPrice(station, prices, options) {

    const sortedPrices = prices.sort((a, b) => a.price - b.price);

    $("#priceList").html($.templates("#priceTempl").render(sortedPrices));
    $("#station-info").html($.templates("#stationTempl").render(station));
    $("#prices").toggle(!station.isFreeCharging && prices.length > 0 || prices.length > 0);
    $("#noPricesAvailable").toggle(!station.isFreeCharging && prices.length == 0);
  }

  onSelectedConnectorChanged(callback) {
    $("#select-connector").change(() => {
      callback();
    });
  }

  open(contentKey) {
    this.component.show();

    const content = this.sidebarContent[contentKey];
    $("#sidebarHeader").text(content.header);

    if (this.currentSidebarContentKey) {
      const oldContent = this.sidebarContent[this.currentSidebarContentKey];
      $(`#${oldContent.contentId}`).hide();
    }
    $(`#${content.contentId}`).show();
    this.currentSidebarContentKey = contentKey;
  }

  close() {
    this.component.hide();
  }

  hideAllSidebarContent() {
    for (var key in this.sidebarContent) {
      const content = this.sidebarContent[key];
      $(`#${content.contentId}`).hide();
    }
  }
}