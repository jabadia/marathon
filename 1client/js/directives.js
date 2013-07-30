"use strict"

angular.module("directives", []).

	directive('focusMe', function($timeout)
	{
		return {
			link: function(scope,elem,attrs)
			{
				scope.$watch(attrs.focusMe, function(value)
				{
					if(value !== undefined)
					{
						$timeout(function() 
						{
							console.log("focusing on ",elem[0]);
							elem[0].focus();
						});
					}	
				})
			}
		}
	})
